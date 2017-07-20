var margin = {
		top: 30,
		right: 10,
		bottom: 10,
		left: 10
	},
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

var line = d3.line(),
	background,
	foreground,
	extents;

var dropcont = d3.select('#dropcont'),
	dropcount = d3.select('#dropcount');


var svg = d3.select("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

	x = d3.scaleBand().rangeRound([0, width]).padding(1),
	y = {},
	dragging = {};

var lobar = d3.select("#lobar");
var hibar = d3.select("#hibar");

d3.csv("countries.csv", function (error, countries) {
	// Extract the list of dimensions and create a scale for each.
	//countries[0] contains the header elements, then for all elements in the header
	//different than the categorical elements it creates a y axis in a dictionary by variable name

	var continents = d3.nest()
		.key(function (d) {
			return d['Continent'];
		})
		.entries(countries)

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
		.append('option')
		.html(function (d) {
			return d.key
		})

	x.domain(dimensions = d3.keys(countries[0]).filter(function (d) {

		if (d == "Country" || d == "Continent" || d == "Beverage_Types") {
			return false;
		}
		return y[d] = d3.scaleLinear()
			.domain(d3.extent(countries, function (p) {
				return +p[d];
			}))
			.range([height, 0]);
	}));

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
					.on("brush", brush_parallel_chart));
		})
		.selectAll("rect")
		.attr("x", -8)
		.attr("width", 16);
});

function handleContinent(cont) {
	// selecting a continent will populate the second dropdown with the corresponding countries
}

function handleCountry(country) {
	//selection a country will add it to the display
}


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
