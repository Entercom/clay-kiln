var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  formCreator = require('./form-creator'),
  lib = require('./forms');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute('data-editable', 'title');
      return node;
    }

    function stubData(data) {
      sandbox.stub(edit, 'getData').returns(Promise.resolve({
        title: data
      }));
    }

    describe('open', function () {
      var fn = lib[this.title];

      beforeEach(function () {
        sandbox.stub(formCreator, 'createInlineForm', sandbox.spy());
        sandbox.stub(formCreator, 'createForm', sandbox.spy());
      });

      it('does nothing if inline forms are open', function () {
        var el = stubNode(),
          inlineFormEl = document.createElement('div');

        inlineFormEl.classList.add('editor-inline');
        el.appendChild(inlineFormEl);

        expect(fn('fakeRef', el, 'title')).to.equal(undefined);
        expect(formCreator.createInlineForm.callCount).to.equal(0);
        expect(formCreator.createForm.callCount).to.equal(0);
      });

      it('opens inline forms', function () {
        var checkForms = function () {
          expect(formCreator.createInlineForm.callCount).to.equal(1);
          expect(formCreator.createForm.callCount).to.equal(0);
        };

        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });

        return fn('fakeRef', stubNode(), 'title').then(checkForms);
      });

      it('opens modal forms', function () {
        var checkForms = function () {
          expect(formCreator.createInlineForm.callCount).to.equal(0);
          expect(formCreator.createForm.callCount).to.equal(1);
        };

        stubData({
          value: '123',
          _schema: {
            _display: 'modal'
          }
        });

        return fn('fakeRef', stubNode(), 'title').then(checkForms);
      });
    });
  });
});
