/********************
 * HELPER FUNCTIONS *
 ********************/

function preprocessData(data){
    return data
}

function normalizeCallNo(s){
    return s.replace(/[^a-zA-Z0-9۰-۹?]+/g, "");
}

function cleanData(s) {
    if (typeof s === 'string' || s instanceof String) {
        // add link to URLs:
        s = s.replace(/(http[^ ]+)/g, '<a href="$1" target="_blank">$1</a>');
        // remove line breaks from links: 
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        // decode url-encoded strings:
        s = decodeURIComponent(s);
    }
    return s
}

// hidden child rows, see https://datatables.net/examples/api/row_details.html
function format(rowData) {
    // `rowData` is the original data object for the row
    
    
    // get the description from the descriptions dictionary:
    let city = rowData["City"].trim();
    let lib = String(rowData["Library"]).trim().replace("’", "'");
    let callNo = normalizeCallNo(String(rowData["(Collection + ) Call Number"]));
    console.log("city:" + city);
    console.log("lib:" + lib);
    console.log("callNo:" + callNo);
    let descr = descriptions[city][lib][callNo];
    

    let hiddenRowHtml = '<dl class="columns" dir="auto">';
    for (k in rowData){
        if (rowData[k]){
            hiddenRowHtml += `
            <dt><strong>${k}:</strong></dt>
            <dd>${cleanData(rowData[k])}</dd>
            `;
        }
    }
    hiddenRowHtml += `
            <dt><strong>Description:</strong></dt>
            <dd>${descr}</dd>
            `;
    hiddenRowHtml += '</dl>';

    return hiddenRowHtml;
}

/***************
 * BUILD TABLE *
 ***************/

let table;
let descriptions;
let toggleStr = "Toggle columns: ";

let jsonPath = "data/msDescriptions.json";
$.get(jsonPath, function(contents) {
    descriptions = contents;
});

// set display names for the tsv columns:
let columnAliases = {
    "(Collection + ) Call Number": "Call Number",
    "Witness to text": "Text"
};
let initiallyVisible = [
    "City", 
    "Library", 
    "(Collection + ) Call Number", 
    "Witness to text",
    "Date AH",
    "Date CE",
];

//let tsvPath = "data/IkhwanSafaMSSOverview - Blad1.tsv";
let tsvPath = "data/msData.tsv"
$.get(tsvPath, function(contents) {
    // pass contents of file to Papa.parse to parse the tsv into a list of dictionaries:
    Papa.parse(contents,  {
        header: true,         // each row will become a dictionary
        delimiter: '\t',
        dynamicTyping: true,  // interpret numbers as integers, strings as strings etc.
        quoteChar: false,     // consider quote characters " and ' as literal quotes
        skipEmptyLines: true,
        complete: function(results) {
            // after the tsv file is loaded, extract the column headers
            // and create the column toggle:
            let columns = [
                {
                    // first column: icon for showing collapsed detailed data
                    className: 'dt-control',
                    orderable: false,
                    data: null,
                    defaultContent: ''
                },
            ]
            let i = 0;
            for (key in results.data[0]){
                if (key){
                    i += 1;
                    let visible = initiallyVisible.includes(key) ? "" : "invisible-col";
                    let classStr = `toggle-vis ${visible}`.trim();
                    toggleStr += `<a class="${classStr}" data-column="${i}">${columnAliases[key] || key}</a><span class="single-triangle"></span>`;
                    columns.push({
                        data: key,
                        title: columnAliases[key] || key,
                        visible: initiallyVisible.includes(key)
                    });
                };
            }
            // Then, pass the data to the datatable:
            let data = preprocessData(results.data)
            table = $('#msTable').DataTable( {
                data: data,
                pageLength: 25,  // number of rows displayed by default
                lengthMenu: [10, 25, 50, { label: 'All', value: -1 }],
                columns: columns
            });
            // Add event listener for opening and closing details: 
            table.on('click', 'td.dt-control', function (e) {
                let tr = e.target.closest('tr');
                let row = table.row(tr);
            
                if (row.child.isShown()) {
                    row.child.hide();
                }
                else {
                    row.child(format(row.data())).show();
                }
            });

            // Create the column toggle feature:
            $('#toggleDiv').html(toggleStr.replace(/<span class="single-triangle"><\/span>$/, ""));
            document.querySelectorAll('a.toggle-vis').forEach((el) => {
                el.addEventListener('click', function (e) {
                    console.log("clicked");
                    e.preventDefault();
            
                    let columnIdx = e.target.getAttribute('data-column');
                    let column = table.column(columnIdx);

                    console.log("Clicked: column no. "+columnIdx);
            
                    // Toggle the visibility of the column in the table:
                    column.visible(!column.visible());

                    // Toggle the color of the column name in the toggle list:
                    el.classList.toggle("invisible-col");
                    
                });
            });
        }
    });
});
