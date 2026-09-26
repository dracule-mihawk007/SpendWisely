using Microsoft.AspNetCore.Mvc;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;

namespace SpendWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
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
}
