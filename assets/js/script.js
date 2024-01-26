$(document).ready(function () {

    const API = "1a711f07d39b42a9b9a418f8a796c5b0"; // API Key

    var userSearch = $('#search-input');    // User's search input
    var searchButton = $('#search-button'); // Submit button for search form

    var coords = []; // Array to store lat and lon coordinates

    // Function to get lat and lon based on user's search
    function getCoords(event) {
        event.preventDefault(); // Prevent form from refeshing page
        coords = []; // Reset the coords array
        var location = userSearch.val(); // Store user's search

        // Check user entered a value and make sure it isn't a number
        if (location === "" || parseInt(location)) {
            return;
        }

        var url = `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=5&appid=${API}` // Geo API for getting lon and lat given user's search

        // Fetch request from API to get coodinates and store in coords array
        fetch(url).then(function(response) {
            return response.json();
        }).then(function(data) {
            console.log(data);
            // Use try/catch to check coordinates can be fetched
            try {
                // Push coords to array
                coords.push(data[0].lat);
                coords.push(data[0].lon);
            } catch {
                return;
            }

            // Store user's search data for history 
            var search = [data[0].name, coords[0], coords[1]]
            var hist = JSON.parse(localStorage.getItem('history'));
            // Check if history array exists in local storage
            if (hist != null) {
                // Check for repeat names and don't include them in history
                for (var i = 0; i < hist.length; i++) {
                    // If name is a repeat
                    if (search[0] === hist[i][0]) {
                        // Show user weather data but exit function so you don't add to history
                        getWeatherData(coords);
                        return;
                    }
                }
                // If there are more than 10 items in history then replace the oldest one
                if (hist.length >= 10) {
                    hist.pop();
                    hist.unshift(search);
                } else {
                    hist.unshift(search);
                }
            } else {
                hist = [search];
            }
            localStorage.setItem('history', JSON.stringify(hist)); // Save newly updated history array to local storage
            getWeatherData(coords);
        })
    }

    // Function to fetch weather data
    function getWeatherData(coords) {
        // Pass lat and lon to the forcast API
        var url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords[0]}&lon=${coords[1]}&appid=${API}`;

        // Fetch weather data from API.
        fetch(url).then(function(response) {
            return response.json();
        }).then(function(data) {

            // ---------------------- Current Weather Data -----------------------------------
            // Append all data to relevant elements
            var name = $('<h4>').text(data.city.name + ", " + data.city.country);
            var date = $('<p>').text(dayjs().format('DD MMMM YYYY'));
            var icon = $('<img>').attr('src', 'https://openweathermap.org/img/wn/' + data.list[0].weather[0].icon + '@2x.png');
            var temp = $('<p>').text('Temperature: ' + parseFloat(data.list[0].main.temp - 273.15).toFixed(2) + '°C');
            var hum = $('<p>').text('Humidity: ' + data.list[0].main.humidity + "%");
            var wind = $('<p>').text('Wind Speed: ' + data.list[0].wind.speed + 'm/s');

            // Change background color of div based on current weather conditions
            $('#today').removeClass();
            getWeatherBackground(data.list[0], $('#today'));
            // --------------------------------------------------------------------------------

            // ---------------------- Future Weather Data -------------------------------------
            // Empty div to clear old data
            $('#forecast').empty();
            $('#forecast').append($('<h3>5-Day Forecast</h3>'));

            var n = 8; // n = number of units in a day add 8 to n each iteration to get next day
            // loop for 5 days add a card with the relevant data for that day
            for (var i = 0; i < 5; i++) {
                var time = data.list[n];
                $('#forecast').append(`
                    <div class="card mx-auto" id="${i}" style="width: 12rem;">
                        <img src="https://openweathermap.org/img/wn/${time.weather[0].icon}@2x.png" class="card-img-top" alt="${time.weather[0].main}">
                        <div class="card-body">
                            <h5 class="card-date">${dayjs().date() + i + 1}/${dayjs().month()}/${dayjs().year()}</h5>
                            <p class="card-temp">Temp: ${parseFloat(time.main.temp - 273.15).toFixed(2) + '°C'}</p>
                            <p class="card-wind">Wind: ${time.wind.speed}m/s</p>
                            <p class="card-hum">Humidity: ${time.main.humidity}%</p>
                        </div>
                    </div>
                `)
                // Add a background to each card depending on weather
                getWeatherBackground(time, $(`#${i}`));
                n += 8;
                // Make sure n doesn't go out of range
                if (n > 39) {
                    n = 39;
                }
            }       

            // Add all elements to the page
            $('#today').empty();
            $('#today').append(name, date, icon, temp, hum, wind).addClass('mt-3 today-border');
            
            getHistory();
        });
    }

    // Function to change backgound of weather elements based on the type of weather
    function getWeatherBackground(data, el) {
        var current = data.weather[0].main;
        if (current === "Clear") {
            el.addClass('clear');
        } else if (current === "Clouds") {
            el.addClass('clouds');
        } else if (current === "Rain") {
            el.addClass('rain');        
        } else if (current === "Snow") {
            el.addClass('snow');          
        } else if (current === "Thunderstorm") {
            el.addClass('storm');      
        } else {
            el.addClass('other');
        }
    }

    // Function to retrieve history from localStorage and display history on the page
    function getHistory() {
        var history = JSON.parse(localStorage.getItem('history')); // Retrieve history array
        var histDisplay = $('#history'); // Grab display element
        histDisplay.empty(); // Empty the display as a "refresh"
        // As long as history exists
        if (history != null) {
            // Loop items in history and apply lat and lon data attributes to buttons and append to page
            for (var i = 0; i < history.length; i++) {
                var lat = history[i][1].toString();
                var lon = history[i][2].toString();
                histDisplay.append($(`<button class="btn">${history[i][0]}</button>`).data('lat', lat).data('lon', lon));
            }
        }
    }

    // Function to retrieve coordinates from history buttons and pass to the getWeatherData function
    function showHistoryData() {
        coords = [];
        console.log($(this).data('lon'))
        coords.push($(this).data('lat'));
        coords.push($(this).data('lon'));
        getWeatherData(coords);
    }

    function clearHistory() {
        localStorage.clear();
        getHistory();
    }

    // Retrieve the history upon page load
    getHistory();

    // Listen for events on search and history buttons
    searchButton.on('click', getCoords);
    $('#history').on('click', '*', showHistoryData);
    $('#clear-button').on('click', clearHistory);

});