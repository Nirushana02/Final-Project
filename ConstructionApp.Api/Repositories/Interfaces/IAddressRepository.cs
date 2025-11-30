
// Repositories/IAddressRepository.cs
using ConstructionApp.Api.Models;

public interface IAddressRepository
{
    Task<IEnumerable<Address>> GetUserAddressesAsync(int userId);
    Task<Address?> GetDefaultAddressAsync(int userId);
    Task<Address?> GetByIdAsync(int addressId, int userId);
    Task AddAsync(Address address);
    Task UpdateAsync(Address address);
    Task DeleteAsync(Address address);
    Task SetAllNonDefaultAsync(int userId);
}