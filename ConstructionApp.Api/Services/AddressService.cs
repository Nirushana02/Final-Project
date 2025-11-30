// Services/AddressService.cs   ← ONLY THIS ONE FILE CREATE PANNU
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Data;

namespace ConstructionApp.Api.Services
{
    public class AddressService
    {
        private readonly AppDbContext _db;
        private readonly IHttpContextAccessor _http;

        public AddressService(AppDbContext db, IHttpContextAccessor http)
        {
            _db = db;
            _http = http;
        }

        private int UserId => int.Parse(_http.HttpContext!.User.FindFirst("UserID")!.Value);

        // GET all addresses
        public async Task<List<AddressDto>> GetMyAddresses()
        {
            return await _db.Addresses
                .Where(a => a.UserID == UserId)
                .OrderByDescending(a => a.IsDefault)
                .Select(a => new AddressDto
                {
                    AddressID = a.AddressID,
                    Street = a.Street,
                    City = a.City,
                    State = a.State,
                    PostalCode = a.PostalCode,
                    Country = a.Country,
                    IsDefault = a.IsDefault
                })
                .ToListAsync();
        }

        // GET default address (for booking)
        public async Task<AddressDto?> GetDefaultAddress()
        {
            var addr = await _db.Addresses
                .FirstOrDefaultAsync(a => a.UserID == UserId && a.IsDefault);

            if (addr == null)
                addr = await _db.Addresses
                    .Where(a => a.UserID == UserId)
                    .OrderBy(a => a.AddressID)
                    .FirstOrDefaultAsync();

            return addr == null ? null : new AddressDto
            {
                AddressID = addr.AddressID,
                Street = addr.Street,
                City = addr.City,
                State = addr.State,
                PostalCode = addr.PostalCode,
                Country = addr.Country,
                IsDefault = addr.IsDefault
            };
        }

        // CREATE new address
        public async Task<AddressDto> CreateAddress(CreateAddressRequest req)
        {
            if (req.IsDefault)
            {
                await _db.Addresses
                    .Where(a => a.UserID == UserId)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));
            }

            var address = new Address
            {
                UserID = UserId,
                Street = req.Street.Trim(),
                City = req.City.Trim(),
                State = req.State.Trim(),
                PostalCode = req.PostalCode.Trim(),
                Country = string.IsNullOrEmpty(req.Country) ? "Sri Lanka" : req.Country.Trim(),
                IsDefault = req.IsDefault
            };

            _db.Addresses.Add(address);
            await _db.SaveChangesAsync();

            return new AddressDto
            {
                AddressID = address.AddressID,
                Street = address.Street,
                City = address.City,
                State = address.State,
                PostalCode = address.PostalCode,
                Country = address.Country,
                IsDefault = address.IsDefault
            };
        }

        // UPDATE address
        public async Task UpdateAddress(int id, UpdateAddressRequest req)
        {
            var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == UserId)
                       ?? throw new KeyNotFoundException("Address not found");

            if (req.IsDefault && !addr.IsDefault)
            {
                await _db.Addresses
                    .Where(a => a.UserID == UserId)
                    .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));
            }

            addr.Street = req.Street.Trim();
            addr.City = req.City.Trim();
            addr.State = req.State.Trim();
            addr.PostalCode = req.PostalCode.Trim();
            addr.Country = string.IsNullOrEmpty(req.Country) ? "Sri Lanka" : req.Country.Trim();
            addr.IsDefault = req.IsDefault;

            await _db.SaveChangesAsync();
        }

        // SET DEFAULT
        public async Task SetDefault(int id)
        {
            await _db.Addresses
                .Where(a => a.UserID == UserId)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsDefault, false));

            var addr = await _db.Addresses.FirstAsync(a => a.AddressID == id && a.UserID == UserId);
            addr.IsDefault = true;
            await _db.SaveChangesAsync();
        }

        // DELETE address
        public async Task DeleteAddress(int id)
        {
            var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == UserId)
                       ?? throw new KeyNotFoundException();

            bool wasDefault = addr.IsDefault;
            _db.Addresses.Remove(addr);
            await _db.SaveChangesAsync();

            if (wasDefault)
            {
                var next = await _db.Addresses
                    .Where(a => a.UserID == UserId)
                    .OrderBy(a => a.AddressID)
                    .FirstOrDefaultAsync();
                if (next != null)
                {
                    next.IsDefault = true;
                    await _db.SaveChangesAsync();
                }
            }
        }
    }
}