// Controllers/AddressesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Data;
using System.Security.Claims;

namespace ConstructionApp.Api.Controllers
{
    [Authorize]
    [Route("api/addresses")]
    [ApiController]


    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContext;

        public AddressesController(AppDbContext context, IHttpContextAccessor httpContext)
        {
            _context = context;
            _httpContext = httpContext;
        }

        // SUPER SAFE UserID Extractor – 100% crash-proof!
        private int GetCurrentUserId()
        {
            var user = _httpContext.HttpContext?.User;

            // Try multiple possible claim names (flexible)
            var userIdClaim = user?.FindFirst("UserID") 
                           ?? user?.FindFirst(ClaimTypes.NameIdentifier)
                           ?? user?.FindFirst("sub");

            if (userIdClaim == null || string.IsNullOrWhiteSpace(userIdClaim.Value))
            {
                throw new UnauthorizedAccessException("UserID claim not found in token");
            }

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid UserID format in token");
            }

            return userId;
        }

        // GET: api/addresses/my
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<AddressDto>>> GetMyAddresses()
        {
            var userId = GetCurrentUserId();

            var addresses = await _context.Addresses
                .Where(a => a.UserID == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.AddressID)
                .Select(a => new AddressDto
                {
                    AddressID = a.AddressID,
                    Street = a.Street,
                    City = a.City,
                    State = a.State,
                    PostalCode = a.PostalCode,
                    Country = a.Country ?? "Sri Lanka",
                    IsDefault = a.IsDefault
                })
                .ToListAsync();

            return Ok(new { success = true, data = addresses });
        }

        // GET: api/addresses/default
        [HttpGet("default")]
        public async Task<ActionResult<AddressDto>> GetDefaultAddress()
        {
            var userId = GetCurrentUserId();

            var addr = await _context.Addresses
                .Where(a => a.UserID == userId && a.IsDefault)
                .Select(a => new AddressDto
                {
                    AddressID = a.AddressID,
                    Street = a.Street,
                    City = a.City,
                    State = a.State,
                    PostalCode = a.PostalCode,
                    Country = a.Country ?? "Sri Lanka",
                    IsDefault = true
                })
                .FirstOrDefaultAsync();

            // If no default → return first address
            if (addr == null)
            {
                addr = await _context.Addresses
                    .Where(a => a.UserID == userId)
                    .OrderBy(a => a.AddressID)
                    .Select(a => new AddressDto
                    {
                        AddressID = a.AddressID,
                        Street = a.Street,
                        City = a.City,
                        State = a.State,
                        PostalCode = a.PostalCode,
                        Country = a.Country ?? "Sri Lanka",
                        IsDefault = false
                    })
                    .FirstOrDefaultAsync();
            }

            return addr != null 
                ? Ok(addr) 
                : NotFound(new { success = false, message = "No address found. Please add an address first." });
        }

        // POST: api/addresses
        [HttpPost]
        public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var userId = GetCurrentUserId();

            if (request.IsDefault)
            {
                await _context.Addresses
                    .Where(a => a.UserID == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));
            }

            var address = new Address
            {
                UserID = userId,
                Street = request.Street?.Trim() ?? string.Empty,
                City = request.City?.Trim() ?? string.Empty,
                State = request.State?.Trim() ?? string.Empty,
                PostalCode = request.PostalCode?.Trim() ?? string.Empty,
                Country = string.IsNullOrWhiteSpace(request.Country) ? "Sri Lanka" : request.Country.Trim(),
                IsDefault = request.IsDefault
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var dto = new AddressDto
            {
                AddressID = address.AddressID,
                Street = address.Street,
                City = address.City,
                State = address.State,
                PostalCode = address.PostalCode,
                Country = address.Country,
                IsDefault = address.IsDefault
            };

            return Created($"/api/addresses/{address.AddressID}", dto);
        }

        // PUT: api/addresses/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] UpdateAddressRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var userId = GetCurrentUserId();
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == userId);

            if (address == null)
                return NotFound(new { success = false, message = "Address not found" });

            if (request.IsDefault && !address.IsDefault)
            {
                await _context.Addresses
                    .Where(a => a.UserID == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));
            }

            address.Street = request.Street?.Trim() ?? address.Street;
            address.City = request.City?.Trim() ?? address.City;
            address.State = request.State?.Trim() ?? address.State;
            address.PostalCode = request.PostalCode?.Trim() ?? address.PostalCode;
            address.Country = string.IsNullOrWhiteSpace(request.Country) ? "Sri Lanka" : request.Country.Trim();
            address.IsDefault = request.IsDefault;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH: api/addresses/{id}/default
        [HttpPatch("{id}/default")]
        public async Task<IActionResult> SetAsDefault(int id)
        {
            var userId = GetCurrentUserId();
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == userId);

            if (address == null)
                return NotFound(new { success = false, message = "Address not found" });

            await _context.Addresses
                .Where(a => a.UserID == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));

            address.IsDefault = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Default address updated successfully" });
        }

        // DELETE: api/addresses/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetCurrentUserId();
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == userId);

            if (address == null)
                return NotFound(new { success = false, message = "Address not found" });

            bool wasDefault = address.IsDefault;
            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            if (wasDefault)
            {
                var next = await _context.Addresses
                    .Where(a => a.UserID == userId)
                    .OrderBy(a => a.AddressID)
                    .FirstOrDefaultAsync();

                if (next != null)
                {
                    next.IsDefault = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { success = true, message = "Address deleted successfully" });
        }
    }
}