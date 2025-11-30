// Controllers/TechnicianController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Helpers;

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/technician")]
    public class TechnicianController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TechnicianController(AppDbContext db)
        {
            _db = db;
        }

        // GET: /api/technician/me
        // Requires a valid JWT. Uses helper to get user id from claims.
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                int userId = User.GetUserId(); // extension from UserExtensions.cs

                var user = await _db.Users
                    .Include(u => u.Technician)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserID == userId);

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                if (user.Technician == null)
                    return NotFound(new { success = false, message = "Technician profile not found" });

                var dto = new
                {
                    success = true,
                    data = new
                    {
                        userId = user.UserID,
                        fullName = user.FullName,
                        email = user.Email,
                        phone = user.Phone,
                        technicianId = user.Technician.TechnicianID,
                        profileImage = user.Technician.ProfileImage,
                        experienceYears = user.Technician.ExperienceYears,
                        ratingAverage = user.Technician.RatingAverage,
                        availability = user.Technician.AvailabilityStatus,
                        verificationStatus = user.Technician.VerificationStatus
                    }
                };

                return Ok(dto);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }
            catch (Exception ex)
            {
                // log if you have a logger
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
