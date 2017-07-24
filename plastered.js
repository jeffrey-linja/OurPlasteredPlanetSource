var margin = {
		top: 20,
		right: 30,
		bottom: 30,
		left: 50
	},
	width = 700 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

var line = d3.line(),
	background,
	foreground,
	extents;

var dropcont = d3.select('#dropcont');
var dropcount = d3.select('#dropcount');


var svg = d3.select("#b")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

	x = d3.scaleBand().rangeRound([0, width]).padding(1),
	y = {},
	dragging = {};


/*In example codes the term svg is overload. Here we have
different terms for it.
lobar.append(..) or hibar.append(..)
*/

d3.csv("countries.csv", function (error, countries) {
	// Extract the list of dimensions and create a scale for each.
	//countries[0] contains the header elements, then for all elements in the header
	//different than the categorical elements it creates a y axis in a dictionary by variable name

	var continents = d3.nest()
		.key(function (d) {
			return d['Continent'];
		})
		.entries(countries)

	var allcountries = d3.nest()
		.key(function (d) {
			return d['Country'];
		})
		.entries(countries);

	var barsData = d3.nest()
		.key(function (d) {
			return d['Country'];
		})
		.key(function (d) {
			return d['Beverage_Types'];
		}).entries(countries);

	continents = continents.sort(function (a, b) {
		if (a.key < b.key) return -1;
		if (a.key > b.key) return 1;
		return 0;
	})

	dropcont.selectAll('option')
		.data(continents, function (d) {
			return d;
		})
		.enter()
		.append("option")
		.attr("value", function (d) {
			return d.key;
		})
		.text(function (d) {
			return d.key;
		});

	dropcount.selectAll('option')
		.data(allcountries, function (d) {
			return d;
		})
		.enter()
		.append("option")
		.attr("value", function (d) {
			return d.key;
		})
		.text(function (d) {
			return d.key;
		});

	//lower year bound for 
	initStackedBarChart('2000', "a");


	x.domain(
		dimensions = d3.keys(countries[0]).filter(function (d) {
			if (d == "Country" || d == "Continent" || d == "Beverage_Types") {
				return false;
			}
			return y[d] = d3.scaleLinear()
				.domain(d3.extent(countries, function (p) {
					return +p[d];
				}))
				.range([height, 0]);
		}));

	countries = countries.filter(function (d) {
		return d.Beverage_Types == "All types";
	})

	extents = dimensions.map(function (p) {
		return [0, 0];
	});

	// Add grey background lines for context.
	background = svg.append("g")
		.attr("class", "background")
		.selectAll("path")
		.data(countries)
		.enter().append("path")
		.attr("d", path);

	// Add blue foreground lines for focus.
	foreground = svg.append("g")
		.attr("class", "foreground")
		.selectAll("path")
		.data(countries)
		.enter().append("path")
		.attr("d", path);

	// Add a group element for each dimension.
	var g = svg.selectAll(".dimension")
		.data(dimensions)
		.enter().append("g")
		.attr("class", "dimension")
		.attr("transform", function (d) {
			return "translate(" + x(d) + ")";
		})
		.call(d3.drag()
			.subject(function (d) {
				return {
					x: x(d)
				};
			})
			.on("start", function (d) {
				dragging[d] = x(d);
				background.attr("visibility", "hidden");
			})
			.on("drag", function (d) {
				dragging[d] = Math.min(width, Math.max(0, d3.event.x));
				foreground.attr("d", path);
				dimensions.sort(function (a, b) {
					return position(a) - position(b);
				});
				x.domain(dimensions);
				g.attr("transform", function (d) {
					return "translate(" + position(d) + ")";
				})
			})
			.on("end", function (d) {
				delete dragging[d];
				transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
				transition(foreground).attr("d", path);
				background
					.attr("d", path)
					.transition()
					.delay(500)
					.duration(0)
					.attr("visibility", null);
			}));
	// Add an axis and title.
	g.append("g")
		.attr("class", "axis")
		.each(function (d) {
			d3.select(this).call(d3.axisLeft(y[d]));
		})
		.append("text")
		.style("text-anchor", "middle")
		.attr("y", -9)
		.text(function (d) {
			return d;
		});

	// Add and store a brush for each axis.
	g.append("g")
		.attr("class", "brush")
		.each(function (d) {
			d3.select(this)
				.call(y[d].brush = d3.brushY()
					.extent([[-8, 0], [8, height]])
					.on("brush start", brushstart)
					.on("brush", brush_parallel_chart)
				);
		})
		.selectAll("rect")
		.attr("x", -8)
		.attr("width", 16);

	//near-global var for the continent-specific selected countries
	var selectCountries;

	//the on change behaviour for the continent dropdown
	dropcont.on('change', function () {
		var selected = this.value;

		selectCountries = countries.filter(function (d) {
			return d['Continent'] == selected;
		})

		//update the country dropdown to only include countries
		//from the selected continent

		dropcount.selectAll('option')
			.remove();

		dropcount.selectAll('option')
			.data(selectCountries, function (d) {
				return d;
			})
			.enter().append('option')
			.attr('value', function (d) {
				return d.Country;
			})
			.text(function (d) {
				return d.Country;
			});

		updatePlot(selected);
		// executed every time a different continent is selected

	})

	//  when selecting a country, executes the addCountry function
	dropcount.on('change', function () {
		var selectedCountry = this.value;
		addCountry(selectedCountry);
	})


	initStackedBarChart('2014', "c");

	//initial setup of the stacked bar charts
	function initStackedBarChart(year, chart) {

		var svg = d3.select("#" + chart),
			margin = {
				top: 30,
				right: 80,
				bottom: 30,
				left: 50
			},
			width = +svg.attr("width") - margin.left - margin.right,
			height = +svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleBand()
			.rangeRound([0, width])
			.padding(0.3)
			.align(0.3);

		var y = d3.scaleLinear()
			.rangeRound([height, 0]);

		var z = d3.scaleOrdinal(d3.schemeCategory20c);

		var stack = d3.stack();

		d3.csv(year + ".csv ", type, function (error, data) {
			if (error) throw error;

			x.domain(data.map(function (d) {
				return d.Country;
			}));
			y.domain([0, d3.max(data, function (d) {
				return d.total;
			})]).nice();
			z.domain(data.columns.slice(1));

			g.selectAll(".serie")
				.data(stack.keys(data.columns.slice(1))(data))
				.enter().append("g")
				.attr("class", "serie")
				.attr("fill", function (d) {
					return z(d.key);
				})
				.selectAll("rect")
				.data(function (d) {
					return d;
				})
				.enter().append("rect")
				.attr("x", function (d) {
					return x(d.data.Country);
				})
				.attr("y", function (d) {
					return y(d[1]);
				})
				.attr("height", function (d) {
					return y(d[0]) - y(d[1]);
				})
				.attr("width", x.bandwidth());

			g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));

			g.append("g")
				.attr("class", "axis axis--y")
				.call(d3.axisLeft(y).ticks(10, "s"))
				.append("text")
				.attr("x", 2)
				.attr("y", y(y.ticks(10).pop()))
				.attr("dy", "0.35em")
				.attr("text-anchor", "start")
				.attr("fill", "#000")
				.text("Liters, per capita");

			var legend = g.selectAll(".legend")
				.data(data.columns.slice(1))
				.enter().append("g")
				.attr("class", "legend")
				.attr("transform", function (d, i) {
					return "translate(0," + i * 20 + ")";
				})
				.style("font", "10px sans-serif");

			legend.append("rect")
				.attr("x", width + 18)
				.attr("width", 18)
				.attr("height", 18)
				.attr("fill", z);

			legend.append("text")
				.attr("x", width + 44)
				.attr("y", 9)
				.attr("dy", ".35em")
				.attr("text-anchor", "start")
				.text(function (d) {
					return d;
				});

			g.append("text")
				.attr("x", (width / 2))
				.attr("y", 0 - (margin.top / 2))
				.attr("text-anchor", "middle")
				.style("font-size", "16px")
				.text("Breakdown for Year: " + year);
		});

		function type(d, i, columns) {
			for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
			d.total = t;
			return d;
		}
	};

	function updatePlot(cont) {
		//updates parallel coordinates plot
		selectCountries = countries.filter(function (d) {
			return d.Continent == cont;
		})
		var notSelectCountries = countries.filter(function (d) {
			return d.Continent != cont;
		})

		svg.selectAll("path").remove();
		// remove everything

		g.append("g")
			.attr("class", "axis")
			.each(function (d) {
				d3.select(this).call(d3.axisLeft(y[d]));
			})
			.append("text")
			.style("text-anchor", "middle")
			.attr("y", -9)
			.text(function (d) {
				return d;
			});
		// Add axis and title, again

		g.append("g")
			.attr("class", "brush")
			.each(function (d) {
				d3.select(this)
					.call(y[d].brush = d3.brushY()
						.extent([[-8, 0], [8, height]])
						.on("brush start", brushstart)
						.on("brush", brush_parallel_chart)
					);
			})
			.selectAll("rect")
			.attr("x", -8)
			.attr("width", 16);
		// Add and store a brush for each axis, again


		svg.append("g")
			.attr("class", "background")
			.selectAll("path")
			.data(notSelectCountries)
			.enter().append("path")
			.attr("d", path);
		// redraw all irrelevant countries as gray lines

		svg.append("g")
			.attr("class", "foreground")
			.selectAll("path")
			.data(selectCountries)
			.enter().append("path")
			.attr("d", path)
			.on("mouseover", highlight);
		// and redraw all selected countries as blue lines

	}

	function addCountry(cn) { // DOES NOT HAVE ADD TO BARCHART FUNCTIONALITY

		var notSelectCountries = countries.filter(function (d) {
			return d.Country != cn;
		})
		cn = countries.filter(function (d) {
			return d.Country == cn;
		})

		svg.selectAll("path").remove();

		g.append("g")
			.attr("class", "axis")
			.each(function (d) {
				d3.select(this).call(d3.axisLeft(y[d]));
			})
			.append("text")
			.style("text-anchor", "middle")
			.attr("y", -9)
			.text(function (d) {
				return d;
			});

		svg.append("g")
			.attr("class", "background")
			.selectAll("path")
			.data(notSelectCountries)
			.enter().append("path")
			.attr("d", path);
		// redraw all irrelevant countries as gray lines

		svg.append("g")
			.attr("class", "foreground")
			.selectAll("path")
			.data(cn)
			.enter().append("path")
			.attr("d", path)
			.on("mouseover", highlight);
		// and redraw the only country as a blue line
	}

});

function position(d) {
	var v = dragging[d];
	return v == null ? x(d) : v;
}

function transition(g) {
	return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
	return line(dimensions.map(function (p) {
		return [position(p), y[p](d[p])];
	}));
}

function brushstart() {
	d3.event.sourceEvent.stopPropagation();
}


// Handles a brush event, toggling the display of foreground lines.
function brush_parallel_chart() {
	for (var i = 0; i < dimensions.length; ++i) {
		if (d3.event.target == y[dimensions[i]].brush) {
			extents[i] = d3.event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);

		}
	}

	foreground.style("display", function (d) {
		return dimensions.every(function (p, i) {
			if (extents[i][0] == 0 && extents[i][0] == 0) {
				return true;
			}
			return extents[i][1] <= d[p] && d[p] <= extents[i][0];
		}) ? null : "none";
	});
}

function brushend() {

}
