using Microsoft.AspNetCore.Mvc;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;

namespace SpendWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly IScanService _scanService;

    public ExpensesController(IExpenseService expenseService, IScanService scanService)
    {
        _expenseService = expenseService;
        _scanService = scanService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExpenseDto>>> GetAll(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? categoryId)
    {
        var filter = new ExpenseFilterDto(fromDate, toDate, categoryId);
        return Ok(await _expenseService.GetAllAsync(filter));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExpenseDto>> GetById(int id)
    {
        var expense = await _expenseService.GetByIdAsync(id);
        return expense is null ? NotFound() : Ok(expense);
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create([FromBody] CreateExpenseDto dto)
    {
        var created = await _expenseService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _expenseService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("monthly-total")]
    public async Task<ActionResult<decimal>> GetMonthlyTotal(
        [FromQuery] int categoryId,
        [FromQuery] int year,
        [FromQuery] int month)
    {
        var total = await _expenseService.GetMonthlyTotalByCategoryAsync(categoryId, year, month);
        return Ok(total);
    }

    [HttpPost("scan")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ScanPreviewDto>> Scan(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType.ToLower()))
            return BadRequest("Only JPEG, PNG, and WebP images are supported.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var bytes = ms.ToArray();

        var preview = await _scanService.ScanAndPreviewAsync(bytes, file.FileName, file.ContentType);
        return Ok(preview);
    }
}
