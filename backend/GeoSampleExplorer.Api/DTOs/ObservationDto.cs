namespace GeoSampleExplorer.Api.DTOs;

public class ObservationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Region { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ObservedAt { get; set; }
}
