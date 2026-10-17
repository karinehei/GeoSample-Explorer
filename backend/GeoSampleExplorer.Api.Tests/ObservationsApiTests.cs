using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GeoSampleExplorer.Api.DTOs;
using Xunit;

namespace GeoSampleExplorer.Api.Tests;

public class ObservationsApiTests : IClassFixture<GeoSampleExplorerWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _client;

    public ObservationsApiTests(GeoSampleExplorerWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await _client.GetAsync("/api/observations");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var observations = await response.Content.ReadFromJsonAsync<ObservationDto[]>(JsonOptions);
        Assert.NotNull(observations);
        Assert.True(observations.Length > 0);
    }

    [Fact]
    public async Task GetAll_FilterByTypePrefix_DoesNotMatchLongerType()
    {
        var response = await _client.GetAsync("/api/observations?type=So");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var observations = await response.Content.ReadFromJsonAsync<ObservationDto[]>(JsonOptions);
        Assert.NotNull(observations);
        Assert.DoesNotContain(observations, o => o.Type == "Soil");
    }

    [Fact]
    public async Task GetAll_FilterByRegionPrefix_DoesNotMatchLongerRegion()
    {
        var response = await _client.GetAsync("/api/observations?region=Nor");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var observations = await response.Content.ReadFromJsonAsync<ObservationDto[]>(JsonOptions);
        Assert.NotNull(observations);
        Assert.DoesNotContain(observations, o => o.Region == "North");
    }

    [Fact]
    public async Task GetAll_FilterByType_ReturnsOnlyMatchingObservations()
    {
        var response = await _client.GetAsync("/api/observations?type=Soil");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var observations = await response.Content.ReadFromJsonAsync<ObservationDto[]>(JsonOptions);
        Assert.NotNull(observations);
        Assert.All(observations, o => Assert.Equal("Soil", o.Type));
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        var response = await _client.GetAsync("/api/observations/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidPayload_Returns400()
    {
        var invalidPayload = new
        {
            name = "",
            type = "",
            latitude = 999,
            longitude = 999,
            region = "",
            observedAt = "2024-01-15T10:00:00Z"
        };

        var response = await _client.PostAsJsonAsync("/api/observations", invalidPayload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_ValidPayload_Returns201()
    {
        var validPayload = new
        {
            name = "Test Observation",
            type = "Soil",
            latitude = 52.0,
            longitude = 13.0,
            region = "TestRegion",
            observedAt = "2024-01-15T10:00:00Z",
            description = (string?)null
        };

        var response = await _client.PostAsJsonAsync("/api/observations", validPayload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/api/observations/", response.Headers.Location!.ToString());

        var created = await response.Content.ReadFromJsonAsync<ObservationDto>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal("Test Observation", created.Name);
        Assert.Equal("Soil", created.Type);
        Assert.Equal(52.0, created.Latitude);
        Assert.Equal(13.0, created.Longitude);
    }
}
