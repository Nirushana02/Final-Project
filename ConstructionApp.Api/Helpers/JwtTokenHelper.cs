using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Helpers
{
    public class JwtTokenHelper
    {
        private readonly IConfiguration _config;

        public JwtTokenHelper(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                // இவை ரெண்டும் must for AddressesController!
                new Claim("UserID", user.UserID.ToString()),                    // THIS LINE WAS MISSING!
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),   // Standard ID claim

                new Claim(ClaimTypes.Name, user.FullName ?? user.Email),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role ?? "Customer"),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            // Technician extra claims
            if (user.Role == "Technician" && user.Technician != null)
            {
                claims.Add(new Claim("technicianId", user.Technician.TechnicianID.ToString()));
                claims.Add(new Claim("verificationStatus", user.Technician.VerificationStatus ?? "Pending"));
            }

            // Admin extra claims
            if (user.Role == "Admin" && user.Admin != null)
            {
                claims.Add(new Claim("adminLevel", user.Admin.AdminLevel ?? "SuperAdmin"));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found in configuration")));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}