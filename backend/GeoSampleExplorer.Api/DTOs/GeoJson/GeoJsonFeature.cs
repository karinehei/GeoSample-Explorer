namespace GeoSampleExplorer.Api.DTOs.GeoJson;

/// <summary>
/// RFC 7946 GeoJSON Feature.
/// </summary>
public class GeoJsonFeature
{
    public string Type { get; } = "Feature";
    public GeoJsonPointGeometry Geometry { get; init; } = null!;
    public GeoJsonObservationProperties Properties { get; init; } = null!;
}
