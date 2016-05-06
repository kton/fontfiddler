'use strict';

var FontFiddler = React.createClass({
  displayName: 'FontFiddler',

  getInitialState: function getInitialState() {
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
      data: {
        tags: [],
        tagged: {}
      }
    };
  },

  componentDidMount: function componentDidMount() {
    if (this.isMounted()) {

      var _allfonts = JSON.parse(localStorage.getItem('allFonts'));
      if (_allfonts) {
        this.setState({ allfonts: _allfonts, fonts: _allfonts });
      } else {
        // first run, reload page after 250ms
        window.setTimeout(function () {
          location.reload();
        }, 250);
      }

      var _data = JSON.parse(localStorage.getItem('data'));
      if (_data) {
        this.setState({ data: _data });
      }
    }
  },

  handleChange: function handleChange(event) {
    var that = this;

    if (event.target.id === 'previewText') {
      this.setState({ previewText: event.target.value });
    } else if (event.target.id === 'previewFontSize') {
      this.setState({ previewFontSize: event.target.value + 'pt' });
    } else if (event.target.id === 'previewFontFilter') {
      var text = event.target.value;

      if (this.state.selectedtags.length > 0) {
        var matched = [];

        this.state.selectedtags.forEach(function (tag) {
          that.state.allfonts.map(function (font) {
            if (that.state.data.tagged[font] && that.state.data.tagged[font].indexOf(tag) > -1) {
              matched.push(font);
            }
          });
        });

        if (text.length > 0) {
          var matchedFonts = matched.filter(function (font) {
            return font.toLowerCase().indexOf(text.toLowerCase()) > -1;
          });

          this.setState({ fonts: matchedFonts });
        } else {
          this.setState({ fonts: matched });
        }
      } else {

        if (text.length > 0) {
          var matchedFonts = this.state.allfonts.filter(function (font) {
            return font.toLowerCase().indexOf(text.toLowerCase()) > -1;
          });

          this.setState({ fonts: matchedFonts });
        } else {
          this.setState({ fonts: this.state.allfonts });
        }
      }
    }
  },
  handleToggle: function handleToggle(event) {
    var origin = event.target.id;
    var state = {};
    state[origin] = !this.state[origin];
    this.setState(state);
  },

  handleTag: function handleTag(event) {
    var origin = event.target.id;

    // clone this.state.data so that we don't mutate it directly
    var _data = {};
    _data.tags = this.state.data.tags.slice();
    _data.tagged = {};

    for (var font in this.state.data.tagged) {
      _data.tagged[font] = this.state.data.tagged[font].slice();
    }

    if (origin === 'addTag' || origin === 'removeTag') {
      var promptText = 'Enter a tag name';
      if (origin === 'addTag') {
        promptText += ' to add';
      }
      if (origin === 'removeTag') {
        promptText += ' to remove';
      }

      var tag = window.prompt(promptText);

      if (tag && tag.length > 0) {
        var index = _data.tags.indexOf(tag);

        if (origin === 'addTag' && index === -1) {
          _data.tags.push(tag);
        } else if (origin === 'removeTag' && index !== -1) {
          _data.tags.splice(index, 1);
        }
      }
    } else {
      var tag = event.target.textContent;
      var fontId = event.target.value;

      if (tag && fontId) {
        if (!_data.tagged[fontId]) {
          _data.tagged[fontId] = [];
        }

        var index = _data.tagged[fontId].indexOf(tag);

        if (index === -1) {
          _data.tagged[fontId].push(tag);
        } else {
          _data.tagged[fontId].splice(index, 1);
        }

        if (_data.tagged[fontId].length < 1) {
          delete _data.tagged[fontId];
        }
      }
      // console.log('tagged: ' + JSON.stringify(_data.tagged));
    }

    this.setState({ data: _data }, function () {
      localStorage.setItem('data', JSON.stringify(this.state.data));
    });
  },

  handleSelect: function handleSelect(event) {
    var that = this;
    var options = event.target.querySelectorAll('option');
    var selected = [];

    for (var i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }

    // use callbacks with this.setState, otherwise this.state returns existing value
    if (selected.length === 0 || selected.length === 1 && selected[0] === 'all') {
      this.setState({ selectedtags: [] }, function () {
        that.setState({ fonts: that.state.allfonts });
      });
    } else {
      this.setState({ selectedtags: selected }, function () {

        // console.log('selected tags: ' + JSON.stringify(that.state.selectedtags));

        if (that.state.selectedtags.length > 0) {
          var matched = [];

          that.state.selectedtags.forEach(function (tag) {
            that.state.allfonts.map(function (font) {
              if (that.state.data.tagged[font] && that.state.data.tagged[font].indexOf(tag) > -1) {
                matched.push(font);
              }
            });
          });

          that.setState({ fonts: matched });
        } else {
          that.setState({ fonts: that.state.allfonts });
        }
      });
    }

    // document.getElementById('previewFontFilter').value = '';

    document.getElementById('previewFontFilter').dispatchEvent(new Event('change', { 'bubbles': true }));
  },

  render: function render() {
    var that = this;
    var previewFontStyles = '';
    if (this.state.previewFontBold) {
      previewFontStyles += ' bold';
    }
    if (this.state.previewFontItalic) {
      previewFontStyles += ' italic';
    }
    if (this.state.previewFontUnderline) {
      previewFontStyles += ' underline';
    }
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { id: 'previewTextSidebar' },
        React.createElement(
          'select',
          { name: 'previewFontTags', multiple: true, size: '25', onChange: this.handleSelect },
          React.createElement(
            'optgroup',
            { label: 'Presets' },
            React.createElement(
              'option',
              { value: 'all' },
              'All fonts'
            )
          ),
          React.createElement(
            'optgroup',
            { label: 'Tags' },
            !!this.state.data.tags && !!this.state.data.tags.length > 0 && this.state.data.tags.map(function (tag) {
              return React.createElement(
                'option',
                { value: tag },
                tag
              );
            })
          )
        ),
        React.createElement('br', null),
        React.createElement(
          'button',
          { id: 'addTag', type: 'button', onClick: this.handleTag },
          'Add tag'
        ),
        React.createElement(
          'button',
          { id: 'removeTag', type: 'button', onClick: this.handleTag },
          'Remove tag'
        )
      ),
      React.createElement(
        'div',
        { id: 'previewTextControls' },
        React.createElement('input', { id: 'previewFontFilter', onChange: this.handleChange,
          placeholder: 'Filter by font name' }),
        React.createElement(
          'span',
          null,
          '' + this.state.fonts.length + ' / ' + this.state.allfonts.length + ' fonts'
        ),
        React.createElement('input', { id: 'previewText', onChange: this.handleChange, value: this.state.previewText,
          placeholder: 'Preview text' }),
        React.createElement('input', { id: 'previewFontSize', type: 'range', onChange: this.handleChange,
          defaultValue: '64', min: '8', step: '1', max: '128' }),
        React.createElement(
          'span',
          null,
          this.state.previewFontSize
        ),
        React.createElement(
          'button',
          { type: 'button', id: 'previewFontBold',
            style: !!this.state.previewFontBold ? { fontWeight: 'bold' } : {},
            onClick: this.handleToggle },
          'B'
        ),
        React.createElement(
          'button',
          { type: 'button', id: 'previewFontItalic',
            style: !!this.state.previewFontItalic ? { fontStyle: 'italic' } : {},
            onClick: this.handleToggle },
          'I'
        ),
        React.createElement(
          'button',
          { type: 'button', id: 'previewFontUnderline',
            style: !!this.state.previewFontUnderline ? { textDecoration: 'underline' } : {},
            onClick: this.handleToggle },
          'U'
        )
      ),
      React.createElement(
        'div',
        { id: 'previewTextPane' },
        React.createElement(
          'ul',
          null,
          !this.state.allfonts.length && React.createElement(
            'li',
            null,
            'Loading your fonts...'
          ),
          !this.state.fonts.length && !!this.state.allfonts.length && React.createElement(
            'li',
            null,
            'No fonts matching your criteria'
          ),
          !!this.state.fonts.length && this.state.fonts.map(function (font) {
            return React.createElement(
              'li',
              { key: font },
              React.createElement(
                'div',
                { className: 'fontTagger' },
                React.createElement(
                  'div',
                  { className: 'fontTaggerTags' },
                  !!that.state.data.tags && !!that.state.data.tags.length > 0 && that.state.data.tags.map(function (tag) {
                    return React.createElement(
                      'button',
                      { type: 'button', value: font, onClick: that.handleTag },
                      tag
                    );
                  })
                )
              ),
              React.createElement(
                'div',
                { className: 'fontHeader' },
                font,
                !!that.state.data.tagged[font] && that.state.data.tagged[font].length > 0 && that.state.data.tagged[font].map(function (tag) {
                  return React.createElement(
                    'span',
                    null,
                    tag
                  );
                })
              ),
              React.createElement(
                'p',
                { style: { fontFamily: font,
                    fontSize: that.state.previewFontSize,
                    color: that.state.previewFontColor },
                  className: previewFontStyles },
                that.state.previewText.length > 0 ? that.state.previewText : font
              )
            );
          })
        )
      )
    );
  }
});

React.render(React.createElement(FontFiddler, null), document.body);
