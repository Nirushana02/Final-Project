
// DTOs/AddressDto.cs
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    public class AddressDto
    {
        public int AddressID { get;set; }
        public string Street { get; set; } = null!;
        public string City { get; set; } = null!;
        public string State { get; set; } = null!;
        public string PostalCode { get; set; } = null!;
        public string Country { get; set; } = null!;
        public bool IsDefault { get; set; }

        // Bonus: Full formatted address – frontend-ல ரொம்ப useful!
        public string FullAddress => $"{Street}, {City}, {State} - {PostalCode}, {Country}";
        
        // Extra bonus: Short version for display
        public string ShortAddress => $"{City}, {State}";
    }

    public class CreateAddressRequest
    {
        [Required(ErrorMessage = "Street is required")]
        [StringLength(200)]
        public string Street { get; set; } = null!;

        [Required(ErrorMessage = "City is required")]
        [StringLength(100)]
        public string City { get; set; } = null!;

        [Required(ErrorMessage = "State/Province is required")]
        [StringLength(100)]
        public string State { get; set; } = null!;

        [Required(ErrorMessage = "Postal Code is required")]
        [StringLength(20)]
        public string PostalCode { get; set; } = null!;

        [StringLength(100)]
        public string Country { get; set; } = "Sri Lanka"; // Perfect for your project!

        public bool IsDefault { get; set; } = false;
    }

    // Bonus: Update address request (future use)
    public class UpdateAddressRequest : CreateAddressRequest
    {
        public int AddressID { get; set; }
    }
}