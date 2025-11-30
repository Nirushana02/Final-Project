// DTOs/BookingDto.cs
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    // GET: api/bookings/services → Service dropdown-க்கு
    public class BookingDto
    {
        public int BookingID { get; set; }
        public int CustomerID { get; set; }
        public string CustomerName { get; set; } = null!;
        public int? TechnicianID { get; set; }
        public string? TechnicianName { get; set; }
        public int ServiceID { get; set; }
        public string ServiceName { get; set; } = null!;
        public decimal FixedRate { get; set; }
        public string Description { get; set; } = null!;
        public string Status { get; set; } = "Pending"; // Pending, Accepted, InProgress, Completed, Cancelled
        public DateTime PreferredStartDateTime { get; set; }
        public DateTime PreferredEndDateTime { get; set; }
        public string AddressLine { get; set; } = null!;
        public string? ReferenceImage { get; set; }
        public DateTime BookingDate { get; set; }
        public DateTime? WorkCompletionDateTime { get; set; }
    }

    public class CreateBookingDto
{
    [Required] public int ServiceID { get; set; }


    public int Quantity { get; set; } = 1;
    
    [Required(ErrorMessage = "The Description field is required.")]
    public string Description { get; set; } = string.Empty;

    // இது இல்லாம இருந்தா Angular payload reject ஆகும்!

    [Required] public int AddressID { get; set; }
    [Required] public DateTime PreferredStartDateTime { get; set; }
    [Required] public DateTime PreferredEndDateTime { get; set; }
    public IFormFile? ReferenceImage { get; set; }
}
    public class UpdateBookingStatusDto
    {
        [Required]
        [RegularExpression("^(Accepted|InProgress|Completed|Cancelled)$")]
        public string Status { get; set; } = null!;
    }

    public class AcceptBookingDto
    {
        public int BookingID { get; set; }
    }
}