
// Repositories/AddressRepository.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using Microsoft.EntityFrameworkCore;

public class AddressRepository : IAddressRepository
{
    private readonly AppDbContext _context;

    public AddressRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Address>> GetUserAddressesAsync(int userId)
        => await _context.Addresses
            .Where(a => a.UserID == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.AddressID)
            .ToListAsync();

    public async Task<Address?> GetDefaultAddressAsync(int userId)
        => await _context.Addresses
            .FirstOrDefaultAsync(a => a.UserID == userId && a.IsDefault)
            ?? await _context.Addresses
                .Where(a => a.UserID == userId)
                .OrderBy(a => a.AddressID)
                .FirstOrDefaultAsync();

    public async Task<Address?> GetByIdAsync(int addressId, int userId)
        => await _context.Addresses
            .FirstOrDefaultAsync(a => a.AddressID == addressId && a.UserID == userId);

    public async Task AddAsync(Address address)
    {
        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Address address)
    {
        _context.Addresses.Update(address);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Address address)
    {
        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();
    }

    public async Task SetAllNonDefaultAsync(int userId)
    {
        await _context.Addresses
            .Where(a => a.UserID == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));
    }
}