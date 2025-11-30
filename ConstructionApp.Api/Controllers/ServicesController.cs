using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Data;

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
   // [AllowAnonymous]  
    [Authorize(Roles = "Admin")]
    public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public ServicesController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        // GET: api/admin/services → ServiceDto with CategoryName
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceDto>>> GetAll()
        {
            var services = await _db.Services
                .Include(s => s.Category)
                .Select(s => new ServiceDto
                {
                    ServiceID = s.ServiceID,
                    ServiceName = s.ServiceName,
                    Description = s.Description,
                    FixedRate = s.FixedRate,
                    EstimatedDuration = s.EstimatedDuration,
                    CategoryName = s.Category != null ? s.Category.CategoryName : "Uncategorized",
                    CategoryID = s.CategoryID,
                    ImageUrl = s.ImageUrl,
                    ImagePublicId = s.ImagePublicId
                })
                .OrderBy(s => s.ServiceName)
                .ToListAsync();

            return Ok(services);
        }

        // GET: api/admin/services/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ServiceDto>> GetById(int id)
        {
            var service = await _db.Services
                .Include(s => s.Category)
                .Where(s => s.ServiceID == id)
                .Select(s => new ServiceDto
                {
                    ServiceID = s.ServiceID,
                    ServiceName = s.ServiceName,
                    Description = s.Description,
                    FixedRate = s.FixedRate,
                    EstimatedDuration = s.EstimatedDuration,
                    CategoryName = s.Category != null ? s.Category.CategoryName : "Uncategorized",
                    CategoryID = s.CategoryID,
                    ImageUrl = s.ImageUrl,
                    ImagePublicId = s.ImagePublicId
                })
                .FirstOrDefaultAsync();

            if (service == null) return NotFound();
            return Ok(service);
        }

        // POST: api/admin/services
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServiceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ServiceName))
                return BadRequest(new { message = "Service name is required" });

            var name = dto.ServiceName.Trim();
            if (await _db.Services.AnyAsync(s => s.ServiceName.ToLower() == name.ToLower()))
                return Conflict(new { message = "Service already exists" });

            if (!await _db.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID))
                return BadRequest(new { message = "Invalid CategoryID" });

            var service = new Service
            {
                ServiceName = name,
                CategoryID = dto.CategoryID,
                FixedRate = dto.FixedRate,
                EstimatedDuration = dto.EstimatedDuration,
                Description = dto.Description?.Trim(),
                ImageUrl = dto.ImageUrl,
                ImagePublicId = dto.ImagePublicId
            };

            _db.Services.Add(service);
            await _db.SaveChangesAsync();

            var created = await _db.Services
                .Include(s => s.Category)
                .Where(s => s.ServiceID == service.ServiceID)
                .Select(s => new ServiceDto
                {
                    ServiceID = s.ServiceID,
                    ServiceName = s.ServiceName,
                    Description = s.Description,
                    FixedRate = s.FixedRate,
                    EstimatedDuration = s.EstimatedDuration,
                    CategoryName = s.Category != null ? s.Category.CategoryName : "Uncategorized",
                    CategoryID = s.CategoryID,
                    ImageUrl = s.ImageUrl,
                    ImagePublicId = s.ImagePublicId
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetById), new { id = created!.ServiceID }, created);
        }

        // PUT: api/admin/services/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceDto dto)
        {
            var service = await _db.Services.FindAsync(id);
            if (service == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.ServiceName))
            {
                var name = dto.ServiceName.Trim();
                if (await _db.Services.AnyAsync(s => s.ServiceID != id && s.ServiceName.ToLower() == name.ToLower()))
                    return Conflict(new { message = "Service name already exists" });

                service.ServiceName = name;
            }

            if (dto.CategoryID.HasValue)
            {
                if (!await _db.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID.Value))
                    return BadRequest(new { message = "Invalid CategoryID" });
                service.CategoryID = dto.CategoryID.Value;
            }

            if (dto.FixedRate.HasValue) service.FixedRate = dto.FixedRate.Value;
            if (dto.EstimatedDuration.HasValue && dto.EstimatedDuration.Value > 0)
                service.EstimatedDuration = dto.EstimatedDuration.Value;
            if (dto.Description != null) service.Description = dto.Description.Trim();
            if (dto.ImageUrl != null) service.ImageUrl = dto.ImageUrl;
            if (dto.ImagePublicId != null) service.ImagePublicId = dto.ImagePublicId;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/admin/services/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var service = await _db.Services.FindAsync(id);
            if (service == null) return NotFound();

            _db.Services.Remove(service);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/admin/services/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/{fileName}";
            var publicId = fileName;

            return Ok(new { url, publicId });
        }
    }
}



namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]  
    //[Authorize(Roles = "Admin")]
    public class PublicServicesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicServicesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceDto>>> GetAll()
        {
            var services = await _db.Services
                .Include(s => s.Category)
                .Where(s => s.Category != null && s.Category.IsActive)
                .Select(s => new ServiceDto
                {
                    ServiceID = s.ServiceID,
                    ServiceName = s.ServiceName,
                    Description = s.Description,
                    FixedRate = s.FixedRate,
                    EstimatedDuration = s.EstimatedDuration,
                    CategoryName = s.Category != null ? s.Category.CategoryName : "Uncategorized",
                    CategoryID = s.CategoryID,
                    ImageUrl = s.ImageUrl,
                    ImagePublicId = s.ImagePublicId
                })
                .OrderBy(s => s.ServiceName)
                .ToListAsync();

            return Ok(services);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ServiceDto>> GetById(int id)
        {
            var s = await _db.Services
                .Include(x => x.Category)
                .Where(x => x.ServiceID == id)
                .Select(x => new ServiceDto
                {
                    ServiceID = x.ServiceID,
                    ServiceName = x.ServiceName,
                    Description = x.Description,
                    FixedRate = x.FixedRate,
                    EstimatedDuration = x.EstimatedDuration,
                    CategoryName = x.Category != null ? x.Category.CategoryName : "Uncategorized",
                    CategoryID = x.CategoryID,
                    ImageUrl = x.ImageUrl,
                    ImagePublicId = x.ImagePublicId
                })
                .FirstOrDefaultAsync();

            if (s == null) return NotFound();
            return Ok(s);
        }
    }
}
