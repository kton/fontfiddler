var FontFiddler = React.createClass({
  getInitialState: function() {
    return {
      selectedtags: [],
      allfonts: [], // available fonts
      fonts: [], // displayed fonts
      previewText: '',
      previewFontSize: '64pt',
      previewFontColor: 'black',
      previewFontBold: false,
      previewFontItalic: false,
      previewFontUnderline: false,
      presets: {
        serif: [],
        sansserif: [],
        monospace: [],
        script: []
      },
      data: {
        tags: [],
        tagged: {}
      }
    };
  },
  componentDidMount: function() {
    if (this.isMounted()) {
      var that = this;
      chrome.fontSettings.getFontList(function(_fonts) {
        that.setState({allfonts: _fonts, fonts: _fonts});
      });
      chrome.storage.local.get('tags', function(_tags) {
        if (_tags['tags'] && _tags['tags'].length > 0) {
          that.state.data.tags = _tags['tags'];
        }
        that.forceUpdate();
      });
      chrome.storage.local.get('tagged', function(_tagged) {
        if (_tagged['tagged'] && Object.keys(_tagged['tagged']).length !== 0) {
          that.state.data.tagged = _tagged['tagged'];
        }
        that.forceUpdate();
      });
    }
  },
  handleChange: function(event) {
    var that = this;

    if (event.target.id === 'previewText') {
      this.setState({previewText: event.target.value});
    } else

    if (event.target.id === 'previewFontSize') {
      this.setState({previewFontSize: event.target.value + 'pt'});
    } else

    if (event.target.id === 'previewFontFilter') {
      var text = event.target.value;

      if (this.state.selectedtags.length > 0) {
        var matched = [];

        this.state.selectedtags.forEach(function(tag) {
          that.state.allfonts.map(function(font) {
            if (that.state.data.tagged[font.fontId] &&
                that.state.data.tagged[font.fontId].indexOf(tag) > -1) {
              matched.push(font);
            }
          });
        });

        if (text.length > 0) {
          var matchedFonts = matched.filter(function(font) {
            return font['displayName'].toLowerCase().indexOf(text.toLowerCase()) > -1;
          });

          this.state.fonts = matchedFonts;
        } else {
          this.state.fonts = matched;
        }

      } else {

        if (text.length > 0) {
          var matchedFonts = this.state.allfonts.filter(function(font) {
            return font['displayName'].toLowerCase().indexOf(text.toLowerCase()) > -1;
          });

          this.state.fonts = matchedFonts;
        } else {
          this.state.fonts = this.state.allfonts;
        }
        
      }

      this.forceUpdate();
    }
  },
  handleToggle: function(event) {
    var origin = event.target.id;
    this.state[origin] = !this.state[origin];
    this.forceUpdate();
  },
  handleTag: function(event) {
    var origin = event.target.id;

    if (origin === 'addTag' || origin === 'removeTag') {
      var promptText = 'Enter a tag name';
      if (origin === 'addTag') { promptText += ' to add'; }
      if (origin === 'removeTag') { promptText += ' to remove'; }
      
      var tag = window.prompt(promptText);

      if (tag && tag.length > 0) {
        var index = this.state.data.tags.indexOf(tag);
        
        if (origin === 'addTag' && index === -1) {
          this.state.data.tags.push(tag);
        } else
        if (origin === 'removeTag' && index !== -1) {
          this.state.data.tags.splice(index, 1);
        }
      }

    } else {
      var tag = event.target.textContent;
      var fontId = event.target.value;

      if (tag && fontId) {
        if (!this.state.data.tagged[fontId]) {
          this.state.data.tagged[fontId] = [];
        }

        var index = this.state.data.tagged[fontId].indexOf(tag);

        if (index === -1) {
          this.state.data.tagged[fontId].push(tag);
        } else {
          this.state.data.tagged[fontId].splice(index,1);
        }

        if (this.state.data.tagged[fontId].length < 1) {
          delete this.state.data.tagged[fontId];
        }
      }
      // console.log('tagged: ' + JSON.stringify(this.state.data.tagged));
    }

    chrome.storage.local.set(this.state.data);
    this.forceUpdate();
  },
  handleSelect: function(event) {
    var that = this;
    var options = event.target.querySelectorAll('option');
    var selected = [];

    for (var i=0; i<options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }

    if (selected.length === 0 ||
        (selected.length === 1 && selected[0] === 'all')) {
      this.state.selectedtags = [];
    } else {
      this.state.selectedtags = selected;
    }

    // console.log('selected tags: ' + JSON.stringify(this.state.selectedtags));

    if (this.state.selectedtags.length > 0) {
      var matched = [];

      this.state.selectedtags.forEach(function(tag) {
        that.state.allfonts.map(function(font) {
          if (that.state.data.tagged[font.fontId] &&
              that.state.data.tagged[font.fontId].indexOf(tag) > -1) {
            matched.push(font);
          }
        });
      });

      this.state.fonts = matched;
    } else {
      this.state.fonts = this.state.allfonts;
    }
    
    // document.getElementById('previewFontFilter').value = '';

    document.getElementById('previewFontFilter').dispatchEvent(
      new Event('change', {'bubbles': true})
    );

    this.forceUpdate();
  },
  render: function() {
    var that = this;
    var previewFontStyles = '';
    if (this.state.previewFontBold) { previewFontStyles += ' bold'; }
    if (this.state.previewFontItalic) { previewFontStyles += ' italic'; }
    if (this.state.previewFontUnderline) { previewFontStyles += ' underline'; }
    return (
      <div>

        <div id="previewTextSidebar">
          <select name="previewFontTags" multiple size="25" onChange={this.handleSelect}>
            <optgroup label="Presets">
              <option value="all">All fonts</option>
            </optgroup>
            <optgroup label="Tags">
              {(!!this.state.data.tags &&
                !!this.state.data.tags.length) > 0 &&
                this.state.data.tags.map(function(tag) {
                  return (
                    <option value={tag}>{tag}</option>
                  )
                })
              }
            </optgroup>
          </select>
          <br />
          <button id="addTag" type="button" onClick={this.handleTag}>Add tag</button>
          <button id="removeTag" type="button" onClick={this.handleTag}>Remove tag</button>
        </div>

        <div id="previewTextControls">
          <input id="previewFontFilter" onChange={this.handleChange}
            placeholder="Filter by font name"></input>

          <span>{'' + this.state.fonts.length + ' / ' + this.state.allfonts.length + ' fonts'}</span>

          <input id="previewText" onChange={this.handleChange} value={this.state.previewText}
            placeholder="Preview text"></input>

          <input id="previewFontSize" type="range" onChange={this.handleChange}
            defaultValue="64" min="8" step="1" max="128"></input>

          <span>{this.state.previewFontSize}</span>

          <button type="button" id="previewFontBold"
            style={!!this.state.previewFontBold ? {fontWeight: 'bold'} : {}}
            onClick={this.handleToggle}>B</button>
          <button type="button" id="previewFontItalic"
            style={!!this.state.previewFontItalic ? {fontStyle: 'italic'} : {}}
            onClick={this.handleToggle}>I</button>
          <button type="button" id="previewFontUnderline"
            style={!!this.state.previewFontUnderline ? {textDecoration: 'underline'} : {}}
            onClick={this.handleToggle}>U</button>
        </div>

        <div id="previewTextPane">
          <ul>
            {!this.state.allfonts.length &&
              <li>Loading your fonts...</li>
            }

            {(!this.state.fonts.length && 
              !!this.state.allfonts.length) &&
              <li>No fonts matching your criteria</li>
            }

            {!!this.state.fonts.length &&
              this.state.fonts.map(function(font) {
                return (
                  <li key={font.fontId}>
                    <div className="fontTagger">
                      <div className="fontTaggerTags">
                        {(!!that.state.data.tags &&
                          !!that.state.data.tags.length > 0) &&
                          that.state.data.tags.map(function(tag) {
                            return (
                              <button type="button" value={font.fontId} onClick={that.handleTag}>{tag}</button>
                            )
                          })
                        }
                      </div>
                    </div>
                    <div className="fontHeader">
                      {font.displayName}
                    {(!!that.state.data.tagged[font.fontId] &&
                      that.state.data.tagged[font.fontId].length > 0) &&
                      that.state.data.tagged[font.fontId].map(function(tag) {
                        return (
                          <span>{tag}</span>
                        )
                      })
                    }
                    </div>
                    <p style={{fontFamily: font.displayName,
                               fontSize: that.state.previewFontSize,
                               color: that.state.previewFontColor}}
                       className={previewFontStyles}>
                      {that.state.previewText.length > 0 ? that.state.previewText : font.displayName}
                    </p>
                  </li>
                )
              })
            }
          </ul>
        </div>

      </div>
    );
  }
});

React.render(
  <FontFiddler />,
  document.body
);
