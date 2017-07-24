var slider = d3.select('#dropdiv');

function createSlider(type) {
    var sliderSetting = d3.scaleLinear()
    	.domain([0,1])
    	.range([0, 50])
    	.clamp(true);

    var slider = d3.select('#dropdiv').append("g")
    	.attr("class", "slider")
    	.attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

    slider.append("line")
    	.attr("class", "track")
    	.("x1", sliderSetting.range()[0])
    	.("x2", sliderSetting.range()[1])
    	.select(function() {
    		return this.parentNode.appendChild(
    		this.cloneNode(true));
    	})
    	.attr("class", "track-inset")
    	.select(function() {
    		return this.parentNode.appendChild(
    		this.cloneNode(true));
    	})
    	.attr("class", "track-overlay")
    	.call(d3.drag()
    		.on("start.interrupt", function() {
    			slider.interrupt();
    		})
    		.on("start drag", function() {
    			////// EFFECT WEIGHT //////
    		}))

	slider.insert("g",".track-overlay")
		.attr("class", "ticks")
		.attr("tansform", "translate(0, " + 18 + ") ")
		.selectAll("text")
		.data(sliderSetting.ticks(5))
		.enter().append("text")
		.attr("x", sliderSetting)
		.text(function(d) {
		    return d + "%";
		});

	var handle = slider.insert("circle", ".track-overlay")
		.attr("class", "handle")
		.attr("r", 3);

    slider.each(function(d) {
        d3.select(this)
            .call(updateWeights, type) // calls the updateWeights function
    }
}

function updateWeights(selection, )
