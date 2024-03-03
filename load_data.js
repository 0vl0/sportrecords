function get_data_by_country(sport_data) {
  const countryRecordDict = {};

  sport_data.forEach((data, index) => {
    const { Mark, Competitor, Nat, age, Date, Venue, country_record } = data;
    
    // Create a dictionary with desired fields
    const entry = { Mark, Competitor, Nat, age, Date, Venue, rank: index + 1};
    
    // Check if country_record is already a key in the dictionary
    if (countryRecordDict.hasOwnProperty(country_record)) {
      // Add the entry to the existing list
      countryRecordDict[country_record].push(entry);
    } else {
      // Create a new list with the entry
      countryRecordDict[country_record] = [entry];
    }
  });

  return countryRecordDict;
}

var sport_map = {};

var svg = d3.select("svg"),
             width = window.innerWidth,
             height = window.innerHeight;

svg.attr('width', width)
   .attr('height', height);

var g = svg.append("g");

sport_map.g = g;
sport_map.sport = '100-metres';
document.getElementById("top_title_text").textContent = sport_map.sport;
sport_map.clicked = false;
sport_map.settings_loaded = false;
sport_map.index_sport_settings = {};
sport_map.current_country = "";
sport_map.settings_open = false;

sport_map.index_popup = 0;

sport_map.last_time_svg_clicked = 0;
sport_map.gender = 'men';
sport_map.number_samples = 10;

sport_map.color = d3.scaleLinear()
    .domain([sport_map.number_samples, 1])
    .range(["rgb(100, 0, 0)", "red"])

function onSvgClicked() {
    // console.log('onSvgClicked, clicked = ', sport_map.clicked)
    const currentTime = new Date().getTime();
    if (sport_map.clicked && currentTime-sport_map.last_time_svg_clicked >= 100){
      sport_map.g.selectAll("path")
        .attr("opacity", .8)
      document.getElementById("record_popup").style.visibility = "hidden";
      sport_map.clicked = false   
      console.log('trigger_mouse_out, sport_map.current_country = ', sport_map.current_country);
      trigger_mouse_out(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
      sport_map.index_popup = 0;
      document.getElementById("back_button").style.display = "none";
      document.getElementById("popup_button").style.display = "none";
    }
    if (sport_map.settings_open){
      closePopup();
      sport_map.settings_open = false;
    }
} 
document.getElementById("map").addEventListener("click", onSvgClicked); 
document.getElementById("radio_male").checked = true;

const hashmap_country_codes = {
  "GER": "DEU",
  "SUI":"CHE",
  "NED":"NLD",
  "RSA":"ZAF",
  "BAH":"BHS",
  "NGR":"NGA",
  "PUR":"PRI"
};

function get_country_id(hashmap, key) {
  // console.log('get_country_id: ', key)
  if (key in hashmap) {
      return hashmap[key];
  } else {
      return key;
  }
}

Promise.all([
  // d3.csv("records_reduced.csv"),
  d3.csv("records_reduced_100.csv"),
  d3.json("world.geojson")  
]).then(function(data){
  records_data = data[0];
  sport_map.world = data[1];
  console.log('records_data = ', records_data);
  const country_regex = /\(([A-Z]{3})\)/
  const format = d3.timeFormat("%d %b %Y")


  sport_map.raw = records_data.map((d, i) => {
    // console.log('d = ', d)
    d.country_record = get_country_id(hashmap_country_codes, d.Venue.match(country_regex)[1]);
    d.date_record = d3.timeParse(format)(d.Date);
    if (d.DOB) {
        d.date_of_birth = d3.timeParse(format)(d.DOB);
        d.age = d3.timeYear.count(d.date_of_birth, d.date_record);
    } else {
        // If DOB is missing, set age to null
        d.age = null;
    }
    return d
  })

    
  sport_map.projection = d3.geoEquirectangular().fitSize([width, height], sport_map.world);
  sport_map.path = d3.geoPath().projection(sport_map.projection);

  sport_map.set_sports = [...new Set(sport_map.raw.map(d => d['event_name']))];
  console.log('set_sports = ', sport_map.set_sports);

  sport_map.paths = sport_map.g.selectAll("path")
                               .data(sport_map.world.features);

  sport_map.paths.attr("opacity", .8);

  sport_map.paths.enter().append("path")
                 .attr("fill", "#69b3a2")
                 .attr("d", sport_map.path)
                 .style("fill", function (d) {
                         return "#e1f1f2";
                  }).on("mouseenter", (e,d) => {
                    // console.log('d = ', d)
                    if (sport_map.clicked == false){
                      sport_map.g.selectAll("path")
                        .filter(f => f == d)
                        .attr("opacity", 1)
                    }

                    if (sport_map.clicked == false && sport_map.countries_sport.includes(d.id)){
                    
                      sport_map.g.selectAll("path")
                        // .filter(f => !f.__selected)
                        .attr("opacity", .3)
              
                      sport_map.g.selectAll("path")
                      .filter(f => f == d)
                      .attr("opacity", 1)
                      
                      sport_map.current_country = d.id;
                        
                      // sport_map.g.selectAll("path")
                      // .filter(f => f == d)
                      // .attr("opacity", 1)
                      rank = sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank
                      update_popup();
                      trigger_mouse_over(rank-1);
                    // var data = sport_map.sport_by_country_data[d.id][0];

                     var record_popup = document.getElementById("record_popup");
                    // Set new position values
                    record_popup.style.left = `${(e.layerX+10)}px`; // Example: set the top position to 100 pixels
                    record_popup.style.top = `${(e.layerY+10)}px`;
                    record_popup.style.visibility = "visible";

                      if (sport_map.sport_by_country_data[d.id].length > 1){
                        console.log('length > 1 !')
                        document.getElementById("popup_button").style.display = "inline-block";
                      }
                      
                    }
              
                  })
                .on("mouseleave", (e, d) => {
                  if (sport_map.clicked == false){
                    sport_map.g.selectAll("path")
                    .attr("opacity", .8)
                    document.getElementById("record_popup").style.visibility = "hidden";
                    document.getElementById("popup_button").style.display = "none";
                    document.getElementById("back_button").style.display = "none";
                    sport_map.index_popup = 0;
                    if (sport_map.current_country != ''){
                      trigger_mouse_out(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
                    }
                  }
                })
                .on("click", (e, d) => {
                  console.log('onmouseclick, d = ', d)

                  if (sport_map.countries_sport.includes(d.id)){
                    sport_map.clicked = true
                    document.getElementById("record_popup").style.visibility = "visible";
                    sport_map.last_time_svg_clicked = new Date().getTime();
                  }
                  else{
                    sport_map.clicked = false   
                    // console.log('on mouse clicked trigger_mouse_out, sport_map.current_country = ', sport_map.current_country);
                    trigger_mouse_out(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
                    document.getElementById("record_popup").style.visibility = "hidden";
                    document.getElementById("popup_button").style.display = "none";
                    document.getElementById("back_button").style.display = "none";
                    sport_map.g.selectAll("path")
                          // .filter(f => !f.__selected)
                          .attr("opacity", .8)
                  }
                });

  update_map();
  initialize_table();
  resize_container();
})

function update_popup(){

  var data = sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup];

  document.getElementById("record_competitor").textContent = data.Competitor;
  var flagImage = document.getElementById("flag_image");

  // Update image source and alt attributes
  if (data.Nat in nationalities) {
    console.log('Nat is a key in natinalities');
    // flagImage.style.visibility = "visible";
    flagImage.src = `flags/${get_country_id(hashmap_country_codes, data.Nat)}.png`;
    document.getElementById("record_nationality").textContent = `Nationality: ${nationalities[data.Nat]}`;
  } else {
    flagImage.style.visibility = "none";
    flagImage.src = ``; // Assuming "JAM" is the 3-letter country code
    document.getElementById("record_nationality").textContent = `Nationality: ?`;
  }
  flagImage.alt = "";


  document.getElementById("record_rank").textContent = `Rank: ${data.rank}`;
  document.getElementById("record_mark").textContent = `Mark: ${data.Mark}`;
  document.getElementById("record_age").textContent = `Age: ${data.age}`;
  document.getElementById("record_date").textContent = `Date: ${data.Date}`;
  document.getElementById("record_venue").textContent = `Venue: ${data.Venue}`;
}

document.getElementById("popup_button").onclick = on_next_clicked;
document.getElementById("back_button").onclick = on_back_clicked;

function on_next_clicked(){
  trigger_mouse_out(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
  sport_map.index_popup += 1;
  if (sport_map.sport_by_country_data[sport_map.current_country].length-1 == sport_map.index_popup){
    document.getElementById("popup_button").style.display = "none";
  }
  document.getElementById("back_button").style.display = "block";

  update_popup();
  trigger_mouse_over(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
}

function on_back_clicked(){
  trigger_mouse_out(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
  sport_map.index_popup -= 1;
  if (sport_map.index_popup == 0){
    document.getElementById("back_button").style.display = "none";
  }
  document.getElementById("popup_button").style.display = "block";

  update_popup();
  trigger_mouse_over(sport_map.sport_by_country_data[sport_map.current_country][sport_map.index_popup].rank-1);
}


function update_map() {
  console.log('update_map !')
  console.log('sport-map.number_samples = ', sport_map.number_samples);
  // console.log('sport_map.set_sports = ', sport_map.set_sports)
  // sport_map.sport_data = sport_map.raw.filter(d => d.event_name == sport_map.sport);
  sport_map.sport_data = sport_map.raw.filter(d => d.event_name == sport_map.sport && d.gender == sport_map.gender).slice(0, sport_map.number_samples);;
  console.log('sport_map.sport_data.length = ', sport_map.sport_data.length); 

  sport_map.countries_sport = [... new Set(sport_map.sport_data.map(x => x.country_record))];
  sport_map.sport_by_country_data = get_data_by_country(sport_map.sport_data);

  sport_map.g.selectAll("path")
    .attr("opacity", .8)

  sport_map.g.selectAll("path")
            .attr("d", sport_map.path)
            .style("fill", function (d) {
                if (sport_map.countries_sport.includes(d.id)){
                  return sport_map.color(d3.min(sport_map.sport_by_country_data[d.id].map(x => x.rank)))
                }
                    return "#e1f1f2";
            })
  
}

function initialize_table() {
  var table = document.getElementById('table_athletes');
  // console.log('initialize table, sport_map.sport_data = ', sport_map.sport_data)

  for (var i = 0; i < sport_map.sport_data.length; i++) {
    var row = table.insertRow();
    // console.log('i = ', i)
    var entry = sport_map.sport_data[i];
    // console.log("Rank:", entry.Rank);
    // console.log("Mark:", entry.Mark);
    // console.log("Competitor:", entry.Competitor);
  
    var name_cell = row.insertCell(0);
    name_cell.style.paddingRight = '1vw';
    var flag_cell = row.insertCell(1);
    flag_cell.style.paddingRight = '1vw';
    var position_cell = row.insertCell(2);
    
    name_cell.textContent = entry.Competitor;
    if (entry.Nat in nationalities) {
      flag_cell.innerHTML = '<img src="' + "flags/" + entry.Nat + ".png" + '" alt="' + entry.Competitor + ' Flag" style="width: 2vw;">';
    } else {
      flag_cell.innerHTML = '';
    }
    // flag_cell.innerHTML = '<img src="' + "flags/" + entry.Nat + ".png" + '" alt="' + entry.Competitor + ' Flag" style="width: 2vw;">';
    position_cell.textContent = i+1;

   
    // console.log('color', sport_map.color(i).slice(3, -1) + ', 0.2)')
    // console.log('sport_map.color:', sport_map.color(i));
    (function(index) {
      row.addEventListener('mouseover', function() {
          // Change background color of the row
          this.style.backgroundColor = 'rgba' + sport_map.color(index).slice(3, -1) + ', 0.8)';
      });

      row.addEventListener('mouseout', function() {
        // Reset background color of the row
        this.style.backgroundColor = ''; // Reset to original background color
    });
})(i);

  }
}

function update_table() {
  console.log('update table!');
  var table = document.getElementById('table_athletes');
  var num_rows = table.rows.length;
  console.log('num_rows = ', num_rows);
  console.log('sport_map.sport_data.length = ', sport_map.sport_data.length);
  if (num_rows < sport_map.sport_data.length){
    console.log('adding rows...')
    for (var i = num_rows; i <  sport_map.sport_data.length; i++){
      var row = table.insertRow();
      var name_cell = row.insertCell(0);
      name_cell.style.paddingRight = '1vw';
      var flag_cell = row.insertCell(1);
      flag_cell.style.paddingRight = '1vw';
      var position_cell = row.insertCell(2);
      (function(index) {
        row.addEventListener('mouseover', function() {
            // Change background color of the row
            this.style.backgroundColor = 'rgba' + sport_map.color(index).slice(3, -1) + ', 0.8)';
        });
  
        row.addEventListener('mouseout', function() {
          // Reset background color of the row
          this.style.backgroundColor = ''; // Reset to original background color
      });
  })(i);
    }

  }
  else{
    console.log('deleting rows...')
    for (var i = num_rows-1; i>sport_map.sport_data.length-1; i--){
      table.deleteRow(i)
    }
  }

  for (var i = 0; i < sport_map.sport_data.length; i++) {
    var row = table.rows[i];
    var entry = sport_map.sport_data[i];
    row.cells[0].textContent = entry.Competitor;
    if (entry.Nat in nationalities) {
      row.cells[1].innerHTML = '<img src="' + "flags/" + get_country_id(hashmap_country_codes, entry.Nat) + ".png" + '" alt="' + entry.Competitor + ' Flag" style="width: 2vw;">';
    } else {
      row.cells[1].innerHTML = '';
    }
    row.cells[2].textContent = i+1;
  }
}

function resize_container() {
  var table_container = document.getElementById('table_container');
  var table = document.getElementById('table_athletes');
  
  // Calculate the height of the table content
  var tableHeight = table.clientHeight;
  
  // Get the height of the viewport
  var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Calculate the maximum height the container can have without exceeding the viewport height
  var maxHeight = viewportHeight - table_container.offsetTop;
  
  // Set the height of the container to fit the table content, but ensure it doesn't exceed the maximum height
  table_container.style.height = Math.min(tableHeight, maxHeight) + 'px';
}

function trigger_mouse_over(rowIndex) {
  var table = document.getElementById('table_athletes');
  var row = table.rows[rowIndex]; // Get the row element

  // Create and dispatch a mouseover event on the row element
  var event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
  });
  row.dispatchEvent(event);
}

function trigger_mouse_out(rowIndex) {
  var table = document.getElementById('table_athletes');
  var row = table.rows[rowIndex]; // Get the row element

  // Create and dispatch a mouseover event on the row element
  var event = new MouseEvent('mouseout', {
      bubbles: true,
      cancelable: true,
      view: window
  });
  row.dispatchEvent(event);
}

// Get the slider element
var slider = document.getElementById("slider");
// Get the element to display the slider value
var sliderValueElement = document.getElementById("sliderValue");

// Function to update the displayed value when slider changes
slider.addEventListener("input", function() {
  sliderValueElement.textContent = slider.value;
  on_settings_change();
});

function on_settings_change() {
  settings_list = document.getElementById('settings_list');
  sport_map.color.domain([sport_map.number_samples, 1])
  sport_selected = settings_list.options[settings_list.selectedIndex].value;
//   console.log('sport selected = ', sport_selected);
  sport_map.sport = sport_selected;
//   console.log('sport = ', sport_map.sport);
//   console.log('closing popup, sport_map = ', sport_map);
  document.getElementById("top_title_text").textContent = sport_map.sport;

    // Check if a radio button is selected
    if (document.getElementById("radio_male").checked) {
        sport_map.gender = 'men';
    }
    else{
        sport_map.gender = 'women';
    }

    sport_map.number_samples = document.getElementById("slider").value;
    // console.log('sport_map.gender = ', sport_map.gender);
//   sport_map.color.domain([newDomainMin, newDomainMax]);
  update_map();
  update_table();
}

const maleRadio = document.getElementById('radio_male');
const femaleRadio = document.getElementById('radio_female');

  // Add event listeners to detect changes
  maleRadio.addEventListener('change', function() {
      on_settings_change();
  });

  femaleRadio.addEventListener('change', function() {
    on_settings_change();
  });

  const selectElement = document.getElementById('settings_list');

  // Add event listener to detect changes
  selectElement.addEventListener('change', function() {
    on_settings_change();
  });

function closePopup() {
    document.getElementById("settings_popup").style.display = "none";
    on_settings_change();
}

// window.addEventListener('resize', function() {
//   // Code to execute when the window is resized
//   update_map();
// });

nationalities = {
  "AFG": "Afghan",
  "ALA": "Åland Islander",
  "ALB": "Albanian",
  "DZA": "Algerian",
  "ASM": "American Samoan",
  "AND": "Andorran",
  "AGO": "Angolan",
  "AIA": "Anguillan",
  "ATA": "Antarctic",
  "ATG": "Antiguan or Barbudan",
  "ARG": "Argentine",
  "ARM": "Armenian",
  "ABW": "Aruban",
  "AUS": "Australian",
  "AUT": "Austrian",
  "AZE": "Azerbaijani",
  "BHS": "Bahamian",
  "BHR": "Bahraini",
  "BGD": "Bangladeshi",
  "BRB": "Barbadian",
  "BLR": "Belarusian",
  "BEL": "Belgian",
  "BLZ": "Belizean",
  "BEN": "Beninese",
  "BMU": "Bermudian",
  "BTN": "Bhutanese",
  "BOL": "Bolivian",
  "BIH": "Bosnian or Herzegovinian",
  "BWA": "Motswana",
  "BVT": "Bouvet Islander",
  "BRA": "Brazilian",
  "IOT": "BIOT",
  "BRN": "Bruneian",
  "BGR": "Bulgarian",
  "BFA": "Burkinabé",
  "BDI": "Burundian",
  "KHM": "Cambodian",
  "CMR": "Cameroonian",
  "CAN": "Canadian",
  "CPV": "Cape Verdean",
  "CYM": "Caymanian",
  "CAF": "Central African",
  "TCD": "Chadian",
  "CHL": "Chilean",
  "CHN": "Chinese",
  "CXR": "Christmas Islander",
  "CCK": "Cocos Islander",
  "COL": "Colombian",
  "COM": "Comoran",
  "COG": "Congolese",
  "COD": "Congolese",
  "COK": "Cook Islander",
  "CRI": "Costa Rican",
  "CIV": "Ivorian",
  "HRV": "Croatian",
  "CUB": "Cuban",
  "CYP": "Cypriot",
  "CZE": "Czech",
  "DNK": "Danish",
  "DJI": "Djiboutian",
  "DMA": "Dominican",
  "DOM": "Dominican",
  "ECU": "Ecuadorian",
  "EGY": "Egyptian",
  "SLV": "Salvadoran",
  "GNQ": "Equatorial Guinean",
  "ERI": "Eritrean",
  "EST": "Estonian",
  "ETH": "Ethiopian",
  "FLK": "Falkland Islander",
  "FRO": "Faroese",
  "FJI": "Fijian",
  "FIN": "Finnish",
  "FRA": "French",
  "GUF": "French Guianese",
  "PYF": "French Polynesian",
  "ATF": "French Southern Territories",
  "GAB": "Gabonese",
  "GMB": "Gambian",
  "GEO": "Georgian",
  "DEU": "German",
  "GHA": "Ghanaian",
  "GIB": "Gibraltar",
  "GRC": "Greek",
  "GRL": "Greenlandic",
  "GRD": "Grenadian",
  "GLP": "Guadeloupean",
  "GUM": "Guamanian",
  "GTM": "Guatemalan",
  "GGY": "Channel Islander",
  "GIN": "Guinean",
  "GNB": "Guinean",
  "GUY": "Guyanese",
  "HTI": "Haitian",
  "HMD": "Heard Island and McDonald Islanders",
  "VAT": "Vatican",
  "HND": "Honduran",
  "HKG": "Hong Konger",
  "HUN": "Hungarian",
  "ISL": "Icelander",
  "IND": "Indian",
  "IDN": "Indonesian",
  "IRN": "Iranian",
  "IRQ": "Iraqi",
  "IRL": "Irish",
  "IMN": "Manx",
  "ISR": "Israeli",
  "ITA": "Italian",
  "JAM": "Jamaican",
  "JPN": "Japanese",
  "JEY": "Channel Islander",
  "JOR": "Jordanian",
  "KAZ": "Kazakhstani",
  "KEN": "Kenyan",
  "KIR": "I-Kiribati",
  "PRK": "North Korean",
  "KOR": "South Korean",
  "KWT": "Kuwaiti",
  "KGZ": "Kyrgyzstani",
  "LAO": "Laotian",
  "LVA": "Latvian",
  "LBN": "Lebanese",
  "LSO": "Basotho",
  "LBR": "Liberian",
  "LBY": "Libyan",
  "LIE": "Liechtenstein",
  "LTU": "Lithuanian",
  "LUX": "Luxembourg",
  "MAC": "Macanese",
  "MKD": "Macedonian",
  "MDG": "Malagasy",
  "MWI": "Malawian",
  "MYS": "Malaysian",
  "MDV": "Maldivian",
  "MLI": "Malian",
  "MLT": "Maltese",
  "MHL": "Marshallese",
  "MTQ": "Martiniquais",
  "MRT": "Mauritanian",
  "MUS": "Mauritian",
  "MYT": "Mahoran",
  "MEX": "Mexican",
  "FSM": "Micronesian",
  "MDA": "Moldovan",
  "MCO": "Monegasque",
  "MNG": "Mongolian",
  "MNE": "Montenegrin",
  "MSR": "Montserratian",
  "MAR": "Moroccan",
  "MOZ": "Mozambican",
  "MMR": "Burmese",
  "NAM": "Namibian",
  "NRU": "Nauruan",
  "NPL": "Nepali",
  "NLD": "Dutch",
  "ANT": "Dutch",
  "NCL": "New Caledonian",
  "NZL": "New Zealander",
  "NIC": "Nicaraguan",
  "NER": "Nigerien",
  "NGA": "Nigerian",
  "NIU": "Niuean",
  "NFK": "Norfolk Islander",
  "MNP": "Northern Mariana Islander",
  "NOR": "Norwegian",
  "OMN": "Omani",
  "PAK": "Pakistani",
  "PLW": "Palauan",
  "PSE": "Palestinian",
  "PAN": "Panamanian",
  "PNG": "Papua New Guinean",
  "PRY": "Paraguayan",
  "PER": "Peruvian",
  "PHL": "Filipino",
  "PCN": "Pitcairn Islander",
  "POL": "Polish",
  "PRT": "Portuguese",
  "PRI": "Puerto Rican",
  "QAT": "Qatari",
  "REU": "Réunionese",
  "ROU": "Romanian",
  "RUS": "Russian",
  "RWA": "Rwandan",
  "BLM": "Saint Barthélemy Islander",
  "SHN": "Saint Helenian",
  "KNA": "Kittitian or Nevisian",
  "LCA": "Saint Lucian",
  "MAF": "Saint Martiner",
  "SPM": "Saint-Pierrais or Miquelonnais",
  "VCT": "Saint Vincentian",
  "WSM": "Samoan",
  "SMR": "Sammarinese",
  "STP": "São Toméan",
  "SAU": "Saudi",
  "SEN": "Senegalese",
  "SRB": "Serbian",
  "SYC": "Seychellois",
  "SLE": "Sierra Leonean",
  "SGP": "Singaporean",
  "SVK": "Slovak",
  "SVN": "Slovene",
  "SLB": "Solomon Islander",
  "SOM": "Somali",
  "ZAF": "South African",
  "SGS": "South Georgia or South Sandwich Islands",
  "SSD": "South Sudanese",
  "ESP": "Spanish",
  "LKA": "Sri Lankan",
  "SDN": "Sudanese",
  "SUR": "Surinamese",
  "SJM": "Svalbard",
  "SWZ": "Swazi",
  "SWE": "Swedish",
  "CHE": "Swiss",
  "SYR": "Syrian",
  "TWN": "Taiwanese",
  "TJK": "Tajikistani",
  "TZA": "Tanzanian",
  "THA": "Thai",
  "TLS": "Timorese",
  "TGO": "Togolese",
  "TKL": "Tokelauan",
  "TON": "Tongan",
  "TTO": "Trinidadian or Tobagonian",
  "TUN": "Tunisian",
  "TUR": "Turkish",
  "TKM": "Turkmen",
  "TCA": "Turks and Caicos Islander",
  "TUV": "Tuvaluan",
  "UGA": "Ugandan",
  "UKR": "Ukrainian",
  "ARE": "Emirati",
  "GBR": "British",
  "USA": "American",
  "UMI": "American",
  "URY": "Uruguayan",
  "UZB": "Uzbekistani",
  "VUT": "Ni-Vanuatu",
  "VEN": "Venezuelan",
  "VNM": "Vietnamese",
  "VGB": "British Virgin Islander",
  "VIR": "U.S. Virgin Islander",
  "WLF": "Wallis and Futuna Islander",
  "ESH": "Sahrawi",
  "YEM": "Yemeni",
  "ZMB": "Zambian",
  "ZWE": "Zimbabwean",
}