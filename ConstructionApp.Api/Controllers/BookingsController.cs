// Controllers/BookingsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ConstructionApp.Api.Services;
using ConstructionApp.Api.DTOs;
using System.Security.Claims;

namespace ConstructionApp.Api.Controllers
{
    [Authorize]
    [Route("api/bookings")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly BookingService _bookingService;
        private readonly IHttpContextAccessor _httpContext;

        public BookingsController(BookingService bookingService, IHttpContextAccessor httpContext)
        {
            _bookingService = bookingService;
            _httpContext = httpContext;
        }

        private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        private string CurrentRole => User.FindFirst(ClaimTypes.Role)!.Value;

        // POST: api/bookings → ONLY JSON (Angular & Post | Recommended)
        [HttpPost]
        public async Task<ActionResult<ApiResponseDto>> Create([FromBody] CreateBookingDto dto)
        {
            if (dto == null)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Request body is required" });

            if (!ModelState.IsValid)
                return BadRequest(new ApiResponseDto 
                { 
                    Success = false, 
                    Message = "Validation failed", 
                    Data = ModelState 
                });

            var booking = await _bookingService.CreateBookingAsync(CurrentUserId, dto, null);

            return Created("", new ApiResponseDto
            {
                Success = true,
                Message = "Booking created successfully!",
                Data = booking
            });
        }

        // NEW: For Image Upload (Optional) → Use this if you want file upload
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponseDto>> CreateWithImage([FromForm] CreateBookingDto dto)
        {
            if (dto == null || dto.ReferenceImage == null)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Image is required" });

            if (!ModelState.IsValid)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Validation failed", Data = ModelState });

            var booking = await _bookingService.CreateBookingAsync(CurrentUserId, dto, dto.ReferenceImage);

            return Created("", new ApiResponseDto
            {
                Success = true,
                Message = "Booking with image created successfully!",
                Data = booking
            });
        }

        // GET: api/bookings/my (Customer)
        [HttpGet("my")]
        public async Task<ActionResult<ApiResponseDto>> GetCustomerBookings()
        {
            var bookings = await _bookingService.GetCustomerBookingsAsync(CurrentUserId);
            return Ok(new ApiResponseDto { Success = true, Data = bookings });
        }

        // GET: api/bookings/technician/my (Technician)
        [HttpGet("technician/my")]
        public async Task<ActionResult<ApiResponseDto>> GetTechnicianBookings()
        {
            var technicianId = GetCurrentTechnicianId();
            var bookings = await _bookingService.GetTechnicianBookingsAsync(technicianId);
            return Ok(new ApiResponseDto { Success = true, Data = bookings });
        }

        // GET: api/bookings/available (Technician)
        [HttpGet("available")]
        public async Task<ActionResult<ApiResponseDto>> GetAvailableJobs()
        {
            var technicianId = GetCurrentTechnicianId();
            var jobs = await _bookingService.GetAvailableJobsAsync(technicianId);
            return Ok(new ApiResponseDto { Success = true, Data = jobs });
        }

        // POST: api/bookings/{id}/accept (Technician)
        [HttpPost("{id}/accept")]
        public async Task<ActionResult<ApiResponseDto>> Accept(int id)
        {
            var technicianId = GetCurrentTechnicianId();
            var booking = await _bookingService.AcceptBookingAsync(technicianId, id);
            return Ok(new ApiResponseDto 
            { 
                Success = true, 
                Message = "Booking accepted successfully!", 
                Data = booking 
            });
        }

        // PUT: api/bookings/{id}/status (Technician)
        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponseDto>> UpdateStatus(int id, [FromBody] UpdateBookingStatusDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Status))
                return BadRequest(new ApiResponseDto { Success = false, Message = "Status is required" });

            var technicianId = GetCurrentTechnicianId();
            var booking = await _bookingService.UpdateStatusAsync(technicianId, id, dto.Status);
            
            return Ok(new ApiResponseDto 
            { 
                Success = true, 
                Message = "Status updated successfully!", 
                Data = booking 
            });
        }

        private int GetCurrentTechnicianId()
        {
            var techIdClaim = User.FindFirst("TechnicianID");
            if (techIdClaim == null || !int.TryParse(techIdClaim.Value, out int id))
                throw new UnauthorizedAccessException("Technician ID not found in token");
            return id;
        }
    }
}