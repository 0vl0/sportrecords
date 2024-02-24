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