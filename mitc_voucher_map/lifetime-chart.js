/* Customer lifetime — inits before data.js; script.js refresh after filters load. */
(function () {
    const LIFETIME_COLOR = '#35BE90';
    const LABEL_STYLE = {
        fontSize: '12px',
        fontWeight: '600',
        textOutline: 'none',
        color: '#1a2b3c'
    };

    if (typeof Highcharts !== 'undefined') {
        Highcharts.setOptions({ accessibility: { enabled: false } });
    }

    function formatCountWithPct(value, total) {
        const n = value || 0;
        if (!total || total <= 0) {
            return n === 0 ? '0' : n.toLocaleString();
        }
        const pct = (n / total) * 100;
        const pctStr = pct >= 10 || pct === 0
            ? Math.round(pct) + '%'
            : pct.toFixed(1) + '%';
        return n.toLocaleString() + ' (' + pctStr + ')';
    }

    function lifetimeDataLabelFormatter() {
        const total = this.series.data.reduce(function (sum, p) {
            return sum + (p.y || 0);
        }, 0);
        return formatCountWithPct(this.y, total);
    }

    function getLifetimeMitcKey() {
        const incMitc = document.getElementById('lifetimeMitc');
        const incNon = document.getElementById('lifetimeNonMitc');
        const mitcOn = incMitc ? incMitc.checked : true;
        const nonOn = incNon ? incNon.checked : true;
        if (mitcOn && nonOn) return 'All';
        if (mitcOn) return 'MITC';
        if (nonOn) return 'NON-MITC';
        return null;
    }

    function emptyCounts() {
        const n = (typeof lifetimeBinLabels !== 'undefined' && lifetimeBinLabels.length) || 10;
        return new Array(n).fill(0);
    }

    function sumHistograms(a, b) {
        const len = Math.max(a.length, b.length);
        const out = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
            out[i] = (a[i] || 0) + (b[i] || 0);
        }
        return out;
    }

    function resolveHistogramKey(mitc, age, gender) {
        if (!mitc || typeof lifetimeHistograms === 'undefined') return null;

        const exact = mitc + '|' + age + '|' + gender;
        if (lifetimeHistograms[exact]) return exact;

        return null;
    }

    function getResolvedKey(mitc, age, gender) {
        return resolveHistogramKey(mitc, age, gender);
    }

    function getLifetimeCounts(age, gender) {
        const mitc = getLifetimeMitcKey();
        if (!mitc || typeof lifetimeHistograms === 'undefined') return emptyCounts();

        const resolved = getResolvedKey(mitc, age, gender);
        if (resolved && lifetimeHistograms[resolved]) {
            return lifetimeHistograms[resolved].slice();
        }

        if (mitc === 'All') {
            const mKey = getResolvedKey('MITC', age, gender);
            const nKey = getResolvedKey('NON-MITC', age, gender);
            const mData = mKey ? lifetimeHistograms[mKey] : null;
            const nData = nKey ? lifetimeHistograms[nKey] : null;
            if (mData && nData) return sumHistograms(mData, nData);
            if (mData) return mData.slice();
            if (nData) return nData.slice();
        }

        const fallback = getResolvedKey('All', age, gender);
        if (fallback && lifetimeHistograms[fallback]) {
            return lifetimeHistograms[fallback].slice();
        }

        return emptyCounts();
    }

    function getLifetimeUserTotal(age, gender) {
        const mitc = getLifetimeMitcKey();
        if (!mitc) return 0;

        const resolved = getResolvedKey(mitc, age, gender);
        if (resolved && typeof lifetimeUserTotals !== 'undefined' &&
            lifetimeUserTotals[resolved] != null) {
            return lifetimeUserTotals[resolved];
        }

        return getLifetimeCounts(age, gender).reduce(function (sum, n) {
            return sum + n;
        }, 0);
    }

    function buildLifetimeChartOptions(counts) {
        return {
            chart: { type: 'column', height: 420 },
            title: { text: 'Customer lifetime voucher spend' },
            accessibility: { enabled: false },
            xAxis: {
                categories: lifetimeBinLabels,
                title: { text: 'Total voucher purchase amount (band)' },
                labels: { rotation: -35, style: { fontSize: '11px' } }
            },
            yAxis: {
                min: 0,
                title: { text: 'User count' },
                allowDecimals: false
            },
            legend: { enabled: false },
            tooltip: {
                pointFormatter: function () {
                    const total = this.series.data.reduce(function (s, p) {
                        return s + (p.y || 0);
                    }, 0);
                    const pct = total > 0 ? ((this.y / total) * 100).toFixed(1) : '0';
                    return '<b>' + this.category + '</b><br/>' +
                        this.y.toLocaleString() + ' users (' + pct + '% of chart total)';
                }
            },
            plotOptions: {
                column: {
                    color: LIFETIME_COLOR,
                    borderRadius: 3,
                    dataLabels: {
                        enabled: true,
                        formatter: lifetimeDataLabelFormatter,
                        style: LABEL_STYLE,
                        crop: false,
                        overflow: 'allow'
                    }
                }
            },
            series: [{ name: 'Users', data: counts, color: LIFETIME_COLOR }],
            credits: { enabled: false }
        };
    }

    function chartRenderTarget(chart) {
        if (!chart || !chart.renderTo) return null;
        return typeof chart.renderTo === 'string'
            ? document.getElementById(chart.renderTo)
            : chart.renderTo;
    }

    function ensureLifetimeChart() {
        if (typeof Highcharts === 'undefined' || typeof lifetimeBinLabels === 'undefined') {
            return null;
        }
        const container = document.getElementById('lifetimeChart');
        if (!container) return null;

        const existing = window.lifetimeChart;
        if (existing && chartRenderTarget(existing) === container) {
            return existing;
        }

        container.innerHTML = '';
        const counts = getLifetimeCounts('All', 'All');
        window.lifetimeChart = Highcharts.chart('lifetimeChart', buildLifetimeChartOptions(counts));
        return window.lifetimeChart;
    }

    function updateLifetimeStat(age, gender) {
        const totalEl = document.getElementById('lifetimeUserTotal');
        if (totalEl) {
            totalEl.textContent = getLifetimeUserTotal(age, gender).toLocaleString();
        }
    }

    window.initLifetimeChartOnce = ensureLifetimeChart;

    function readLifetimeFilters() {
        const ageEl = document.getElementById('lifetimeAgeFilter');
        const genderEl = document.getElementById('lifetimeGenderFilter');
        return {
            age: ageEl ? ageEl.value : 'All',
            gender: genderEl ? genderEl.value : 'All'
        };
    }

    window.updateLifetime = function () {
        const chart = ensureLifetimeChart();
        if (!chart || !chart.series || !chart.series[0]) return;

        const f = readLifetimeFilters();
        const counts = getLifetimeCounts(f.age, f.gender);
        const points = counts.map(function (y) { return { y: y }; });

        updateLifetimeStat(f.age, f.gender);
        chart.series[0].update({ color: LIFETIME_COLOR }, false);
        chart.series[0].setData(points, true);
        if (chart.yAxis && chart.yAxis[0]) {
            chart.yAxis[0].setExtremes(0, null, true, false);
        }
        chart.redraw();
        chart.reflow();
    };

    function fillLifetimeSelect(id, values) {
        const el = document.getElementById(id);
        if (!el || !values || !values.length) return;
        while (el.options.length > 1) {
            el.remove(1);
        }
        values.forEach(function (v) {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            el.appendChild(opt);
        });
    }

    window.populateLifetimeFilters = function () {
        const ages = typeof lifetimeFilterAges !== 'undefined' ? lifetimeFilterAges : [];
        const genders = typeof lifetimeFilterGenders !== 'undefined' ? lifetimeFilterGenders : [];
        fillLifetimeSelect('lifetimeAgeFilter', ages);
        fillLifetimeSelect('lifetimeGenderFilter', genders);
    };

    window.bindLifetimeFilters = function () {
        ['lifetimeMitc', 'lifetimeNonMitc', 'lifetimeAgeFilter', 'lifetimeGenderFilter']
            .forEach(function (id) {
                const el = document.getElementById(id);
                if (el) {
                    el.removeEventListener('change', window.updateLifetime);
                    el.addEventListener('change', window.updateLifetime);
                }
            });
    };

    /* Draw chart before data.js blocks the main thread */
    (function bootLifetimeEarly() {
        try {
            if (typeof lifetimeBinLabels === 'undefined') return;
            window.populateLifetimeFilters();
            window.bindLifetimeFilters();
            ensureLifetimeChart();
            window.updateLifetime();
        } catch (err) {
            console.error('Lifetime early init failed:', err);
            const el = document.getElementById('lifetimeChart');
            if (el) {
                el.innerHTML = '<div class="loading-msg error-msg"><h3>Lifetime chart error</h3><p>' +
                    err.message + '</p></div>';
            }
        }
    })();
})();
