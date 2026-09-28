document.addEventListener("DOMContentLoaded", () => {
  const currentYear = document.querySelector("#currentYear");
  const calculator = document.querySelector("#loanCalculator");
  const calculatorMessage = document.querySelector("#calculatorMessage");
  const results = document.querySelector("#calculationResults");
  const nav = document.querySelector("#primaryNav");
  const counters = document.querySelectorAll(".stat strong[data-count]");

  currentYear.textContent = new Date().getFullYear();

  if (counters.length) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const updateCounters = (animate) => {
      counters.forEach((counter) => {
        const target = Number(counter.dataset.count);
        const numberNode = counter.firstChild;

        if (!animate) {
          numberNode.textContent = target.toLocaleString("pt-BR");
          return;
        }

        const duration = 1500;
        const startedAt = performance.now();
        numberNode.textContent = "0";

        const tick = (now) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const easedProgress = 1 - (1 - progress) ** 3;
          numberNode.textContent = Math.round(target * easedProgress).toLocaleString("pt-BR");

          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      updateCounters(false);
    } else {
      const counterObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          updateCounters(true);
          counterObserver.disconnect();
        }
      }, { threshold: 0.4 });

      counterObserver.observe(document.querySelector(".stats-band"));
    }
  }

  document.querySelectorAll("#primaryNav .nav-link, #primaryNav .nav-cta").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) bootstrap.Collapse.getOrCreateInstance(nav).hide();
    });
  });

  calculator.addEventListener("submit", (event) => {
    event.preventDefault();
    calculator.classList.add("was-validated");
    const amountInput = calculator.elements.amount;
    const residualInput = calculator.elements.residual;
    const rateInput = calculator.elements.rate;
    const monthsInput = calculator.elements.months;
    const amount = amountInput.valueAsNumber;
    const residual = residualInput.value === "" ? 0 : residualInput.valueAsNumber;
    const monthlyRate = rateInput.valueAsNumber / 100;
    const months = monthsInput.valueAsNumber;

    residualInput.setCustomValidity(residual >= amount && amount > 0 ? "O valor residual deve ser menor que o financiamento." : "");

    if (!calculator.checkValidity() || !Number.isFinite(amount + residual + monthlyRate + months)) {
      calculatorMessage.textContent = "Revise os campos destacados para calcular a estimativa.";
      calculatorMessage.classList.add("is-error");
      results.hidden = true;
      return;
    }

    const presentValue = amount - residual / ((1 + monthlyRate) ** months);
    const monthlyPayment = monthlyRate === 0
      ? (amount - residual) / months
      : presentValue * monthlyRate / (1 - ((1 + monthlyRate) ** -months));
    const totalPayment = monthlyPayment * months + residual;
    const interestAmount = totalPayment - amount;
    const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    document.querySelector("#monthlyPayment").textContent = currency.format(monthlyPayment);
    document.querySelector("#interestAmount").textContent = currency.format(interestAmount);
    document.querySelector("#totalPayment").textContent = currency.format(totalPayment);
    calculatorMessage.textContent = "Estimativa calculada. As condições reais dependem da instituição financeira.";
    calculatorMessage.classList.remove("is-error");
    results.hidden = false;
  });

  ["amount", "residual", "rate", "months"].forEach((fieldName) => {
    calculator.elements[fieldName].addEventListener("input", () => {
      calculator.elements.residual.setCustomValidity("");
      if (!results.hidden) results.hidden = true;
      calculatorMessage.textContent = "Atualize a simulação para ver os novos valores.";
      calculatorMessage.classList.remove("is-error");
    });
  });
});