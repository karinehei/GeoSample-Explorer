namespace GeoSampleExplorer.Api.DTOs.GeoJson;

/// <summary>
/// RFC 7946 GeoJSON Point geometry.
/// Coordinates are [longitude, latitude] per the GeoJSON spec.
/// </summary>
public class GeoJsonPointGeometry
{
    public string Type { get; } = "Point";
    public double[] Coordinates { get; init; } = null!; // [longitude, latitude]
}
