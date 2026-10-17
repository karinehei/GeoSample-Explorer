using GeoSampleExplorer.Api.Data;
using GeoSampleExplorer.Api.DTOs;
using GeoSampleExplorer.Api.DTOs.GeoJson;
using GeoSampleExplorer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoSampleExplorer.Api.Controllers;

[ApiController]
[Route("api/observations")]
[Produces("application/json")]
public class ObservationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ObservationsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>GET /api/observations - List all observations with optional filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ObservationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ObservationDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? region,
        CancellationToken ct = default)
    {
        var list = await GetFilteredObservations(search, type, region).ToListAsync(ct);
        return Ok(list.Select(ToDto));
    }

    /// <summary>
    /// GET /api/observations/geojson - Returns observations as RFC 7946 GeoJSON FeatureCollection.
    /// Each observation is a Point feature with properties: id, name, type, region, observedAt.
    /// Supports the same query filters as GET /api/observations.
    /// </summary>
    [HttpGet("geojson")]
    [ProducesResponseType(typeof(GeoJsonFeatureCollection), StatusCodes.Status200OK)]
    [Produces("application/geo+json", "application/json")]
    public async Task<ActionResult<GeoJsonFeatureCollection>> GetGeoJson(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? region,
        CancellationToken ct = default)
    {
        var list = await GetFilteredObservations(search, type, region).ToListAsync(ct);
        var features = list.Select(ToGeoJsonFeature).ToList();
        return Ok(new GeoJsonFeatureCollection { Features = features });
    }

    /// <summary>GET /api/observations/{id} - Get a single observation by ID.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ObservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ObservationDto>> GetById(int id, CancellationToken ct = default)
    {
        var obs = await _db.Observations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);
        if (obs == null)
            return NotFound();
        return Ok(ToDto(obs));
    }

    /// <summary>POST /api/observations - Create a new observation.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ObservationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ObservationDto>> Create([FromBody] CreateObservationDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var obs = new Observation
        {
            Name = dto.Name,
            Type = dto.Type,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Region = dto.Region ?? string.Empty,
            Description = dto.Description,
            ObservedAt = dto.ObservedAt,
        };

        _db.Observations.Add(obs);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = obs.Id }, ToDto(obs));
    }

    /// <summary>PUT /api/observations/{id} - Update an existing observation.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ObservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ObservationDto>> Update(int id, [FromBody] UpdateObservationDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existing = await _db.Observations.FindAsync([id], ct);
        if (existing == null)
            return NotFound();

        existing.Name = dto.Name;
        existing.Type = dto.Type;
        existing.Latitude = dto.Latitude;
        existing.Longitude = dto.Longitude;
        existing.Region = dto.Region ?? string.Empty;
        existing.Description = dto.Description;
        existing.ObservedAt = dto.ObservedAt;

        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(existing));
    }

    /// <summary>DELETE /api/observations/{id} - Delete an observation.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(int id, CancellationToken ct = default)
    {
        var existing = await _db.Observations.FindAsync([id], ct);
        if (existing == null)
            return NotFound();

        _db.Observations.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IQueryable<Observation> GetFilteredObservations(string? search, string? type, string? region)
    {
        var query = _db.Observations.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o => o.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(o => o.Type == type);
        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(o => o.Region == region);
        return query.OrderBy(o => o.Name);
    }

    private static ObservationDto ToDto(Observation obs) => new()
    {
        Id = obs.Id,
        Name = obs.Name,
        Type = obs.Type,
        Latitude = obs.Latitude,
        Longitude = obs.Longitude,
        Region = obs.Region,
        Description = obs.Description,
        ObservedAt = obs.ObservedAt,
    };

    private static GeoJsonFeature ToGeoJsonFeature(Observation obs) => new()
    {
        Geometry = new GeoJsonPointGeometry
        {
            Coordinates = [obs.Longitude, obs.Latitude]
        },
        Properties = new GeoJsonObservationProperties
        {
            Id = obs.Id,
            Name = obs.Name ?? string.Empty,
            Type = obs.Type ?? string.Empty,
            Region = obs.Region ?? string.Empty,
            ObservedAt = obs.ObservedAt,
        },
    };
}
