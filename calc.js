/* Pure math for all tools. No DOM here. */
(function (root) {
  var Calc = {};
  function r2(x) { return Math.round(x * 100) / 100; }
  Calc.r2 = r2;

  /* Debt payoff. debts: [{name,balance,apr,min}], extra per month, strategy 'snowball'|'avalanche'.
     Total monthly budget = sum of minimums + extra, so freed minimums roll to the next debt. */
  Calc.debtPayoff = function (debts, extra, strategy) {
    var ds = debts.map(function (d, i) {
      return { i: i, name: d.name, bal: d.balance, apr: d.apr, min: d.min, paidMonth: 0, interest: 0 };
    });
    var budget = extra;
    ds.forEach(function (d) { budget += d.min; });
    var month = 0, totalInterest = 0;
    function active() { return ds.filter(function (d) { return d.bal > 0.005; }); }
    while (active().length && month < 1200) {
      month++;
      active().forEach(function (d) {
        var i = d.bal * d.apr / 1200;
        d.bal += i; d.interest += i; totalInterest += i;
      });
      var avail = budget;
      active().forEach(function (d) {
        var p = Math.min(d.min, d.bal);
        d.bal -= p; avail -= p;
      });
      var order = active().sort(function (a, b) {
        if (strategy === 'avalanche') return (b.apr - a.apr) || (a.bal - b.bal);
        return (a.bal - b.bal) || (b.apr - a.apr);
      });
      order.forEach(function (d) {
        var p = Math.min(avail, d.bal);
        d.bal -= p; avail -= p;
      });
      ds.forEach(function (d) { if (d.bal <= 0.005 && !d.paidMonth) { d.paidMonth = month; d.bal = 0; } });
    }
    var ok = active().length === 0;
    return {
      ok: ok, months: month, totalInterest: r2(totalInterest),
      totalPaid: r2(debts.reduce(function (s, d) { return s + d.balance; }, 0) + totalInterest),
      debts: ds.map(function (d) { return { name: d.name, paidMonth: d.paidMonth, interest: r2(d.interest) }; })
    };
  };

  /* Hourly rate. All money in dollars. */
  Calc.hourlyRate = function (o) {
    var weeks = 52 - o.weeksOff;
    var hours = o.hoursPerWeek * weeks;
    var t = o.taxPct / 100;
    var expensesYear = o.expensesMonth * 12;
    var grossForIncome = o.takeHomeYear / (1 - t);
    var revenue = grossForIncome + expensesYear;
    return {
      billableHours: hours,
      revenueYear: r2(revenue),
      revenueMonth: r2(revenue / 12),
      rate: r2(revenue / hours),
      taxSetAside: r2(grossForIncome - o.takeHomeYear),
      expensesYear: r2(expensesYear)
    };
  };

  /* Holiday budget. people: [{name, weight}], bufferPct reserved for wrapping/shipping/extras. */
  Calc.holiday = function (total, bufferPct, people) {
    var buffer = total * bufferPct / 100;
    var pool = total - buffer;
    var sumW = people.reduce(function (s, p) { return s + p.weight; }, 0);
    var shares = people.map(function (p) {
      return { name: p.name, amount: sumW > 0 ? r2(pool * p.weight / sumW) : 0 };
    });
    return { buffer: r2(buffer), pool: r2(pool), shares: shares };
  };

  /* Savings goal. days = days until target date. aprPct = optional yearly interest. */
  Calc.savings = function (goal, current, days, aprPct) {
    var out = {};
    ['week', 'month'].forEach(function (u) {
      var perYear = u === 'week' ? 52 : 12;
      var n = Math.max(1, Math.floor(days / (365 / perYear)));
      var r = aprPct / 100 / perYear;
      var need;
      if (current >= goal) need = 0;
      else if (r === 0) need = (goal - current) / n;
      else {
        var g = Math.pow(1 + r, n);
        need = (goal - current * g) * r / (g - 1);
        if (need < 0) need = 0;
      }
      out[u] = { periods: n, perPeriod: r2(need) };
    });
    out.remaining = r2(Math.max(0, goal - current));
    return out;
  };

  Calc.money = function (x) {
    return '$' + Number(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  Calc.monthsToText = function (m) {
    var y = Math.floor(m / 12), mo = m % 12, s = [];
    if (y) s.push(y + (y === 1 ? ' year' : ' years'));
    if (mo) s.push(mo + (mo === 1 ? ' month' : ' months'));
    return s.join(' ') || '0 months';
  };
  if (typeof module !== 'undefined') module.exports = Calc;
  root.Calc = Calc;
})(typeof window !== 'undefined' ? window : this);
