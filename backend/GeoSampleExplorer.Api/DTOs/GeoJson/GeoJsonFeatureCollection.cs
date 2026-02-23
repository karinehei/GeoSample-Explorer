namespace GeoSampleExplorer.Api.DTOs.GeoJson;

/// <summary>
/// RFC 7946 GeoJSON FeatureCollection.
/// </summary>
public class GeoJsonFeatureCollection
{
    public string Type { get; } = "FeatureCollection";
    public IReadOnlyList<GeoJsonFeature> Features { get; init; } = Array.Empty<GeoJsonFeature>();
}
