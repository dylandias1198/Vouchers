(function () {
    if (typeof Highcharts !== 'undefined') {
        Highcharts.setOptions({ accessibility: { enabled: false } });
    }

    const STATE_NAMES = {
        'in-an': 'Andaman & Nicobar', 'in-ap': 'Andhra Pradesh', 'in-ar': 'Arunachal Pradesh',
        'in-as': 'Assam', 'in-br': 'Bihar', 'in-cg': 'Chhattisgarh', 'in-ch': 'Chandigarh',
        'in-dd': 'Daman & Diu', 'in-dl': 'Delhi', 'in-dn': 'Dadra & Nagar Haveli',
        'in-ga': 'Goa', 'in-gj': 'Gujarat', 'in-hp': 'Himachal Pradesh', 'in-hr': 'Haryana',
        'in-jh': 'Jharkhand', 'in-jk': 'Jammu & Kashmir', 'in-ka': 'Karnataka',
        'in-kl': 'Kerala', 'in-ld': 'Lakshadweep', 'in-mh': 'Maharashtra', 'in-ml': 'Meghalaya',
        'in-mn': 'Manipur', 'in-mp': 'Madhya Pradesh', 'in-mz': 'Mizoram', 'in-nl': 'Nagaland',
        'in-od': 'Odisha', 'in-pb': 'Punjab', 'in-py': 'Puducherry', 'in-rj': 'Rajasthan',
        'in-sk': 'Sikkim', 'in-tn': 'Tamil Nadu', 'in-tr': 'Tripura', 'in-ts': 'Telangana',
        'in-uk': 'Uttarakhand', 'in-up': 'Uttar Pradesh', 'in-wb': 'West Bengal',
        'unknown': 'No pincode / Unknown'
    };

    const STATE_ABBR = {
        'in-an': 'AN', 'in-ap': 'AP', 'in-ar': 'AR', 'in-as': 'AS', 'in-br': 'BR', 'in-cg': 'CG',
        'in-ch': 'CH', 'in-dd': 'DD', 'in-dl': 'DL', 'in-dn': 'DN', 'in-ga': 'GA', 'in-gj': 'GJ',
        'in-hp': 'HP', 'in-hr': 'HR', 'in-jh': 'JH', 'in-jk': 'JK', 'in-ka': 'KA', 'in-kl': 'KL',
        'in-ld': 'LD', 'in-mh': 'MH', 'in-ml': 'ML', 'in-mn': 'MN', 'in-mp': 'MP', 'in-mz': 'MZ',
        'in-nl': 'NL', 'in-od': 'OD', 'in-pb': 'PB', 'in-py': 'PY', 'in-rj': 'RJ', 'in-sk': 'SK',
        'in-tn': 'TN', 'in-tr': 'TR', 'in-ts': 'TS', 'in-uk': 'UK', 'in-up': 'UP', 'in-wb': 'WB'
    };

    let mapChart;
    let userDemoChart;
    let userMitcChart;
    let trendChart;
    let selectedStates = new Set();

    const DEMO_LABEL_STYLE = {
        fontSize: '12px',
        fontWeight: '600',
        textOutline: 'none',
        color: '#1a2b3c'
    };

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

    function columnDataLabelFormatter() {
        const series = this.series;
        const total = series.data.reduce((sum, p) => sum + (p.y || 0), 0);
        return formatCountWithPct(this.y, total);
    }

    function columnChartBaseOptions(title, xTitle) {
        return {
            chart: { type: 'column', height: 400 },
            title: { text: title },
            xAxis: {
                categories: [],
                title: { text: xTitle },
                labels: { style: { fontSize: '11px' } }
            },
            yAxis: {
                min: 0,
                title: { text: 'Distinct users (um_uuid)' },
                allowDecimals: false
            },
            legend: { enabled: false },
            tooltip: {
                pointFormatter: function () {
                    const total = this.series.data.reduce((s, p) => s + (p.y || 0), 0);
                    const pct = total > 0 ? ((this.y / total) * 100).toFixed(1) : '0';
                    return '<b>' + this.category + '</b><br/>' +
                        this.y.toLocaleString() + ' users (' + pct + '% of chart total)';
                }
            },
            plotOptions: {
                column: {
                    borderRadius: 3,
                    dataLabels: {
                        enabled: true,
                        formatter: columnDataLabelFormatter,
                        style: DEMO_LABEL_STYLE,
                        crop: false,
                        overflow: 'allow'
                    }
                }
            },
            series: [{ name: 'Users', data: [] }],
            credits: { enabled: false }
        };
    }

    function fillSelect(id, values) {
        const el = document.getElementById(id);
        if (!el) return;
        while (el.options.length > 1) {
            el.remove(1);
        }
        values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            el.appendChild(opt);
        });
    }

    function fillStateSelect(id) {
        const el = document.getElementById(id);
        if (!el) return;
        (allStateCodes || []).forEach(code => {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = STATE_NAMES[code] || code;
            el.appendChild(opt);
        });
        const unk = document.createElement('option');
        unk.value = 'unknown';
        unk.textContent = STATE_NAMES.unknown;
        el.appendChild(unk);
    }

    function mergeMapData(raw) {
        const lookup = {};
        (raw || []).forEach(d => { lookup[d.state_code] = d.value; });
        return (allStateCodes || []).map(sc => ({
            'hc-key': sc,
            value: lookup[sc] || 0
        }));
    }

    function getColorForValue(value, maxValue) {
        if (!maxValue || value === 0) return '#e8f5f0';
        const intensity = value / maxValue;
        const r = Math.round(179 - (179 - 10) * intensity);
        const g = Math.round(245 - (245 - 95) * intensity);
        const b = Math.round(225 - (225 - 58) * intensity);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function updateSummary(data) {
        const items = (data || []).filter(d => d.value > 0);
        const total = items.reduce((sum, d) => sum + d.value, 0);
        const filteredEl = document.getElementById('filteredCount');
        if (filteredEl) filteredEl.textContent = total.toLocaleString();

        const tbody = document.getElementById('stateTableBody');
        if (!tbody) return;
        const sorted = [...items].sort((a, b) => b.value - a.value);
        tbody.innerHTML = sorted.map(item => {
            const code = item.state_code || item['hc-key'];
            return `
            <tr>
                <td>${STATE_NAMES[code] || code}</td>
                <td>${item.value.toLocaleString()}</td>
            </tr>`;
        }).join('');
    }

    function updateSelectedDisplay() {
        const selectedList = document.getElementById('selectedList');
        const selectedCount = document.getElementById('selectedCount');
        const deselectBtn = document.getElementById('deselectBtn');
        if (!selectedList) return;

        selectedCount.textContent = selectedStates.size;
        if (selectedStates.size === 0) {
            selectedList.innerHTML = '<span class="muted">Click states on the map to select</span>';
            if (deselectBtn) deselectBtn.disabled = true;
        } else {
            if (deselectBtn) deselectBtn.disabled = false;
            const names = Array.from(selectedStates).map(code => {
                const pt = mapChart.series[0].points.find(p => p['hc-key'] === code);
                return pt ? pt.name : (STATE_NAMES[code] || code);
            });
            selectedList.innerHTML = names.map(name =>
                `<span class="state-tag">${name} <span class="remove" onclick="removeState('${name.replace(/'/g, "\\'")}')">×</span></span>`
            ).join('');
        }
    }

    window.removeState = function (name) {
        const point = mapChart.series[0].points.find(p => p.name === name);
        if (point) {
            selectedStates.delete(point['hc-key']);
            updateMap();
        }
    };

    window.deselectAll = function () {
        selectedStates.clear();
        updateMap();
    };

    const TREND_LINE_COLORS = [
        '#35BE90', '#2980b9', '#e67e22', '#9b59b6', '#c0392b',
        '#16a085', '#8e44ad', '#d35400', '#2c3e50', '#27ae60'
    ];

    function getFilteredTrendRecords() {
        const age = document.getElementById('trendAgeFilter').value;
        const gender = document.getElementById('trendGenderFilter').value;
        return (typeof trendRecords !== 'undefined' ? trendRecords : []).filter(r => {
            if (age !== 'All' && r.a !== age) return false;
            if (gender !== 'All' && r.g !== gender) return false;
            return true;
        });
    }

    function buildTrendSeries(splitBy) {
        const dates = trendDates || [];
        const filtered = getFilteredTrendRecords();

        if (splitBy === 'total') {
            const counts = {};
            filtered.forEach(r => { counts[r.d] = (counts[r.d] || 0) + 1; });
            return [{ name: 'Total', data: dates.map(d => counts[d] || 0) }];
        }

        const field = splitBy === 'age' ? 'a' : 'g';
        const groups = {};
        filtered.forEach(r => {
            const key = r[field] || 'Unknown';
            if (!groups[key]) groups[key] = {};
            groups[key][r.d] = (groups[key][r.d] || 0) + 1;
        });

        return Object.keys(groups).sort().map(name => ({
            name: name,
            data: dates.map(d => (groups[name][d] || 0))
        }));
    }

    function initTrendChart() {
        trendChart = Highcharts.chart('trendChart', {
            chart: { type: 'line', height: 400 },
            title: { text: 'MITC vouchers over time' },
            xAxis: {
                categories: [],
                title: { text: 'Transaction date (txn)' },
                labels: { rotation: -45, style: { fontSize: '10px' } }
            },
            yAxis: {
                min: 0,
                title: { text: 'Voucher count' },
                allowDecimals: false
            },
            legend: {
                enabled: true,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            },
            tooltip: {
                shared: true,
                crosshairs: true
            },
            plotOptions: {
                line: {
                    lineWidth: 2,
                    marker: { radius: 2, enabled: false },
                    states: { hover: { lineWidth: 3 } }
                }
            },
            series: [],
            credits: { enabled: false }
        });
    }

    window.updateTrend = function () {
        if (!trendChart || typeof trendDates === 'undefined') return;

        const splitBy = document.getElementById('trendSplitBy').value;
        const seriesList = buildTrendSeries(splitBy);
        const total = getFilteredTrendRecords().length;

        document.getElementById('trendTotal').textContent = total.toLocaleString();

        while (trendChart.series.length) {
            trendChart.series[0].remove(false);
        }

        seriesList.forEach((s, i) => {
            trendChart.addSeries({
                name: s.name,
                data: s.data,
                color: TREND_LINE_COLORS[i % TREND_LINE_COLORS.length]
            }, false);
        });

        trendChart.xAxis[0].setCategories(trendDates, false);
        trendChart.legend.update({ enabled: seriesList.length > 1 });
        trendChart.redraw();
    };

    window.updateMap = function () {
        if (!mapChart) return;
        const age = document.getElementById('ageFilter').value;
        const gender = document.getElementById('genderFilter').value;
        const key = age + '|' + gender;
        const merged = mergeMapData(voucherData[key] || []);
        const maxValue = Math.max(...merged.map(d => d.value), 1);

        const coloredData = merged.map(item => ({
            'hc-key': item['hc-key'],
            value: item.value,
            color: selectedStates.has(item['hc-key'])
                ? '#1a2b3c'
                : getColorForValue(item.value, maxValue)
        }));

        mapChart.series[0].setData(coloredData);
        mapChart.colorAxis[0].update({ max: maxValue });
        updateSummary(merged);
        updateSelectedDisplay();
    };

    function getDemoFilters() {
        return {
            includeMitc: document.getElementById('demoMitc').checked,
            includeNonMitc: document.getElementById('demoNonMitc').checked,
            age: document.getElementById('demoAge').value,
            gender: document.getElementById('demoGender').value,
            stateFilter: document.getElementById('demoState').value
        };
    }

    function recordPassesDemoFilters(r, f) {
        if (r.m === 'MITC' && !f.includeMitc) return false;
        if (r.m === 'NON-MITC' && !f.includeNonMitc) return false;
        if (f.age !== 'All' && r.a !== f.age) return false;
        if (f.gender !== 'All' && r.g !== f.gender) return false;
        if (f.stateFilter !== 'All' && r.s !== f.stateFilter) return false;
        return true;
    }

    function clearDemoCharts() {
        document.getElementById('demoUserTotal').textContent = '0';
        if (userDemoChart) {
            userDemoChart.series[0].setData([]);
            userDemoChart.xAxis[0].setCategories([]);
        }
        if (userMitcChart) {
            userMitcChart.series[0].setData([]);
            userMitcChart.xAxis[0].setCategories([]);
        }
    }

    window.updateUserDemo = function () {
        const f = getDemoFilters();

        if (!f.includeMitc && !f.includeNonMitc) {
            clearDemoCharts();
            return;
        }

        const byAge = {};
        const byMitc = { MITC: new Set(), 'NON-MITC': new Set() };
        const globalUsers = new Set();
        const ageOrder = typeof demoAgeCategories !== 'undefined'
            ? [...demoAgeCategories]
            : (typeof ageCategories !== 'undefined' ? [...ageCategories] : []);

        (userRecords || []).forEach(r => {
            if (!recordPassesDemoFilters(r, f)) return;
            const ageKey = r.a || 'Under 18 or Unknown';
            if (!byAge[ageKey]) byAge[ageKey] = new Set();
            byAge[ageKey].add(r.u);
            globalUsers.add(r.u);
            if (r.m === 'MITC' && f.includeMitc) byMitc.MITC.add(r.u);
            if (r.m === 'NON-MITC' && f.includeNonMitc) byMitc['NON-MITC'].add(r.u);
        });

        document.getElementById('demoUserTotal').textContent = globalUsers.size.toLocaleString();

        if (userDemoChart) {
            let ageCategories;
            if (f.age === 'All') {
                const seen = new Set(ageOrder);
                Object.keys(byAge).forEach(a => {
                    if (!seen.has(a)) ageOrder.push(a);
                });
                ageCategories = ageOrder.filter(a => byAge[a] && byAge[a].size > 0);
            } else {
                ageCategories = [f.age];
            }
            const ageData = ageCategories.map(a => (byAge[a] || new Set()).size);
            userDemoChart.xAxis[0].update({ labels: { rotation: -35 } }, false);
            userDemoChart.xAxis[0].setCategories(ageCategories, false);
            userDemoChart.series[0].update({ color: '#35BE90' }, false);
            userDemoChart.series[0].setData(ageData, true);
        }

        if (userMitcChart) {
            const mitcCategories = [];
            const mitcData = [];
            const mitcColors = [];
            if (f.includeMitc) {
                mitcCategories.push('MITC');
                mitcData.push(byMitc.MITC.size);
                mitcColors.push('#35BE90');
            }
            if (f.includeNonMitc) {
                mitcCategories.push('NON-MITC');
                mitcData.push(byMitc['NON-MITC'].size);
                mitcColors.push('#5c6b7a');
            }
            userMitcChart.xAxis[0].update({ labels: { rotation: 0 } }, false);
            userMitcChart.xAxis[0].setCategories(mitcCategories, false);
            userMitcChart.series[0].setData(
                mitcData.map((y, i) => ({ y, color: mitcColors[i] })),
                true
            );
        }
    };

    function initUserDemoChart() {
        const opts = columnChartBaseOptions('Distinct users by age category', 'Age category');
        opts.xAxis.labels.rotation = -35;
        opts.plotOptions.column.color = '#35BE90';
        userDemoChart = Highcharts.chart('userDemoChart', opts);
    }

    function initUserMitcChart() {
        const opts = columnChartBaseOptions('MITC vs NON-MITC', 'MITC flag');
        opts.xAxis.labels.rotation = 0;
        opts.plotOptions.column.colorByPoint = true;
        userMitcChart = Highcharts.chart('userMitcChart', opts);
    }

    function initMap(topology) {
        const initialData = mergeMapData(voucherData['All|All'] || []);
        const maxValue = Math.max(...initialData.map(d => d.value), 1);

        mapChart = Highcharts.mapChart('container', {
            chart: {
                map: topology,
                backgroundColor: 'transparent',
                height: 640
            },
            title: {
                text: 'MITC voucher count by state',
                style: { color: '#2c3e50', fontSize: '18px', fontWeight: '600' }
            },
            subtitle: {
                text: 'State labels shown • Click to select • Darker green = more vouchers',
                style: { color: '#7f8c8d', fontSize: '12px' }
            },
            mapNavigation: {
                enabled: true,
                buttonOptions: { verticalAlign: 'bottom' }
            },
            colorAxis: {
                min: 0,
                max: maxValue,
                minColor: '#e8f5f0',
                maxColor: '#0a5f3a'
            },
            legend: {
                title: { text: 'Vouchers' },
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            plotOptions: {
                map: {
                    allAreas: true,
                    joinBy: ['hc-key', 'hc-key'],
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    nullColor: '#f0f0f0',
                    states: { hover: { brightness: 0.08 } },
                    point: {
                        events: {
                            click: function () {
                                const hcKey = this['hc-key'];
                                if (selectedStates.has(hcKey)) selectedStates.delete(hcKey);
                                else selectedStates.add(hcKey);
                                updateMap();
                            }
                        }
                    }
                }
            },
            series: [{
                data: initialData.map(item => ({
                    'hc-key': item['hc-key'],
                    value: item.value,
                    color: getColorForValue(item.value, maxValue)
                })),
                name: 'Vouchers',
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        if (!this.point.value) return '';
                        return STATE_ABBR[this.point['hc-key']] || '';
                    },
                    style: {
                        fontSize: '9px',
                        fontWeight: '700',
                        color: '#1a2b3c',
                        textOutline: '2px contrast'
                    },
                    allowOverlap: false
                }
            }],
            tooltip: {
                formatter: function () {
                    return `<b>${this.point.name}</b><br/>Vouchers: <b>${(this.point.value || 0).toLocaleString()}</b>`;
                }
            },
            credits: { enabled: false },
            exporting: { enabled: true }
        });

        updateSummary(initialData);
        updateSelectedDisplay();
    }

    function assertHighcharts() {
        if (typeof Highcharts === 'undefined') {
            throw new Error('Highcharts did not load. Check your internet connection.');
        }
        if (typeof Highcharts.chart !== 'function') {
            throw new Error('Highcharts.chart is missing.');
        }
        if (typeof Highcharts.mapChart !== 'function') {
            throw new Error('Highcharts.mapChart is missing. Ensure map.js loads after highcharts.js.');
        }
    }

    function showError(elId, title, message) {
        const el = document.getElementById(elId);
        if (!el) return;
        el.innerHTML = '<div class="loading-msg error-msg"><h3>' + title + '</h3><p>' + message + '</p></div>';
    }

    async function boot() {
        if (typeof voucherData === 'undefined') {
            showError('container', 'Data not loaded', 'Run: python3 generate_map.py');
            showError('userDemoChart', 'Data not loaded', 'Run: python3 generate_map.py');
            showError('userMitcChart', 'Data not loaded', 'Run: python3 generate_map.py');
            return;
        }

        assertHighcharts();

        fillSelect('ageFilter', ageCategories || []);
        fillSelect('genderFilter', genders || []);
        fillSelect('demoAge', demoAgeCategories || ageCategories || []);
        fillSelect('demoGender', demoGenders || genders || []);
        fillSelect('trendAgeFilter', ageCategories || []);
        fillSelect('trendGenderFilter', genders || []);
        if (typeof lifetimeFilterAges === 'undefined') {
            fillSelect('lifetimeAgeFilter', demoAgeCategories || ageCategories || []);
        }
        if (typeof lifetimeFilterGenders === 'undefined') {
            fillSelect('lifetimeGenderFilter', demoGenders || genders || []);
        }
        fillStateSelect('demoState');

        document.getElementById('totalRecords').textContent = (totalRecords || 0).toLocaleString();
        document.getElementById('statesCovered').textContent = statesCovered || 0;

        try {
            initUserDemoChart();
            initUserMitcChart();
            updateUserDemo();
        } catch (err) {
            console.error('Users Demo chart error:', err);
            showError('userDemoChart', 'Bar chart failed', err.message);
            showError('userMitcChart', 'Bar chart failed', err.message);
        }

        try {
            if (typeof trendDates !== 'undefined' && typeof trendRecords !== 'undefined') {
                initTrendChart();
                updateTrend();
            }
        } catch (err) {
            console.error('Trend chart error:', err);
            showError('trendChart', 'Trend chart failed', err.message);
        }

        try {
            if (typeof lifetimeBinLabels === 'undefined') {
                showError(
                    'lifetimeChart',
                    'Lifetime data not loaded',
                    'Run: python3 generate_map.py && hard-refresh'
                );
            } else {
                if (typeof window.populateLifetimeFilters === 'function') {
                    window.populateLifetimeFilters();
                } else {
                    fillSelect('lifetimeAgeFilter', demoAgeCategories || ageCategories || []);
                    fillSelect('lifetimeGenderFilter', demoGenders || genders || []);
                }
                if (typeof window.bindLifetimeFilters === 'function') {
                    window.bindLifetimeFilters();
                }
                if (typeof window.updateLifetime === 'function') {
                    window.updateLifetime();
                }
            }
        } catch (err) {
            console.error('Lifetime chart error:', err);
            showError('lifetimeChart', 'Customer lifetime chart failed', err.message);
        }

        try {
            const topology = await fetch(
                'https://code.highcharts.com/mapdata/countries/in/in-all.topo.json'
            ).then(r => {
                if (!r.ok) throw new Error('Could not load India map (' + r.status + ')');
                return r.json();
            });

            const container = document.getElementById('container');
            if (container) container.innerHTML = '';

            initMap(topology);
        } catch (err) {
            console.error('Map error:', err);
            showError('container', 'Map failed to load', err.message);
        }

        requestAnimationFrame(() => {
            [userDemoChart, userMitcChart, trendChart, window.lifetimeChart].forEach(c => {
                if (c && typeof c.reflow === 'function') c.reflow();
            });
        });
    }

    boot().catch(err => {
        console.error(err);
        showError('container', 'Dashboard error', err.message);
        showError('userDemoChart', 'Dashboard error', err.message);
        showError('userMitcChart', 'Dashboard error', err.message);
        showError('lifetimeChart', 'Dashboard error', err.message);
    });
})();
