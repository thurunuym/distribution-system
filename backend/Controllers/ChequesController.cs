using Microsoft.AspNetCore.Mvc;
using DistributionApi.DTOs;
using DistributionApi.Services;

namespace DistributionApi.Controllers;

/// <summary>Manages cheques.</summary>
[ApiController]
[Route("api/cheques")]
public class ChequesController(ChequeService svc) : ControllerBase
{
    /// <summary>Returns all cheques, optionally filtered by status.</summary>
    [HttpGet]
    public async Task<IEnumerable<ChequeResponse>> GetAll([FromQuery] string? status) =>
        await svc.GetChequesAsync(status);

    /// <summary>Updates cheque status (pending→paid or pending→returned).</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ChequeResponse>> Update(int id, [FromBody] UpdateChequeRequest req)
    {
        // TODO: auth guard
        var result = await svc.UpdateChequeAsync(id, req);
        return result is null ? NotFound() : Ok(result);
    }
}