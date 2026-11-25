/* Pure math for the cleaning, pressure washing, wedding and bills tools. No DOM here. */
(function (root) {
  var C2 = {};
  function r2(x) { return Math.round(x * 100) / 100; }
  C2.r2 = r2;

  /* Cleaning: labor hours = sqft / pace + rooms * minutes / 60. Price = labor hours * rate + supplies. */
  C2.cleaningPrice = function (o) {
    var base = o.sqft / o.pace, extra = o.rooms * o.minPerRoom / 60;
    var labor = base + extra, price = labor * o.rate + o.supplies;
    return { laborHours: r2(labor), onSiteHours: r2(labor / o.crew), labor: r2(labor * o.rate), price: r2(price), perSqft: o.sqft > 0 ? r2(price / o.sqft) : 0 };
  };

  /* Pressure washing: sqft * rate + add-ons, never below the minimum job charge. */
  C2.pressurePrice = function (o) {
    var area = o.sqft * o.rate, add = 0;
    o.addons.forEach(function (a) { add += a; });
    var sub = area + add, price = Math.max(sub, o.minCharge);
    return { area: r2(area), addons: r2(add), subtotal: r2(sub), price: r2(price), minApplied: sub < o.minCharge };
  };

  /* Wedding: split total by percent. cats: [{name,pct}]. */
  C2.weddingSplit = function (total, cats, guests) {
    var sum = 0, rows = cats.map(function (c) { sum += c.pct; return { name: c.name, pct: c.pct, amount: r2(total * c.pct / 100) }; });
    return { rows: rows, pctTotal: r2(sum), allocated: r2(total * sum / 100), perGuest: guests > 0 ? r2(total / guests) : 0 };
  };

  /* Bills: monthly equivalent of each bill by how often it is due. */
  var perMonth = { weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  C2.perMonth = perMonth;
  C2.bills = function (bills, payFreq, takeHome) {
    var month = 0;
    var rows = bills.map(function (b) { var m = b.amount * perMonth[b.freq]; month += m; return { name: b.name, amount: b.amount, freq: b.freq, due: b.due, month: r2(m) }; });
    var paychecks = perMonth[payFreq];
    var perPay = month / paychecks;
    return { rows: rows, month: r2(month), year: r2(month * 12), perPaycheck: r2(perPay), paychecksPerMonth: r2(paychecks), left: takeHome > 0 ? r2(takeHome - perPay) : null };
  };

  if (typeof module !== 'undefined') module.exports = C2;
  root.Calc2 = C2;
})(typeof window !== 'undefined' ? window : this);
