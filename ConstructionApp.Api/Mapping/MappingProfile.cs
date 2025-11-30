// File Path: ConstructionApp.Api/Mapping/MappingProfile.cs
using AutoMapper;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;

namespace ConstructionApp.Api.Mapping // இதுதான் இருக்கணும்!
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // BOOKING → BOOKINGDTO – இதுதான் 100% தேவை!
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.CustomerID, opt => opt.MapFrom(src => src.UserID))
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.TechnicianID, opt => opt.MapFrom(src => src.TechnicianID))
                .ForMember(dest => dest.TechnicianName, 
                    opt => opt.MapFrom(src => src.Technician != null ? src.Technician.User.FullName : null))
                .ForMember(dest => dest.ServiceName, opt => opt.MapFrom(src => src.Service.ServiceName))
                .ForMember(dest => dest.FixedRate, opt => opt.MapFrom(src => src.Service.FixedRate))
                .ForMember(dest => dest.AddressLine, 
                    opt => opt.MapFrom(src => $"{src.Address.Street}, {src.Address.City}, {src.Address.State} {src.Address.PostalCode}"))
                .ForMember(dest => dest.ReferenceImage, opt => opt.MapFrom(src => src.ReferenceImage))
                .ForMember(dest => dest.BookingDate, opt => opt.MapFrom(src => src.BookingDate));

            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.UserID, opt => opt.Ignore())
                .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
                .ForMember(dest => dest.BookingDate, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Service, opt => opt.Ignore())
                .ForMember(dest => dest.Address, opt => opt.Ignore())
                .ForMember(dest => dest.Technician, opt => opt.Ignore());
        }
    }
}