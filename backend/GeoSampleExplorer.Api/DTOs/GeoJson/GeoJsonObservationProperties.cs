namespace GeoSampleExplorer.Api.DTOs.GeoJson;

/// <summary>
/// Properties for an observation feature in GeoJSON.
/// </summary>
public class GeoJsonObservationProperties
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public DateTime ObservedAt { get; init; }
}
