/*jshint browser:true, curly:true, eqeqeq:false, forin:true, strict:false, undef:true*/ 
/*global jQuery:false, $:false*/

/* Panelslider
* Swipe handling functions : Slick - Copyright (c) 2014 Ken Wheeler
* > initializeEvents/swipeHandler/swipeDirection/swipeStart/swipeMove/swipeEnd
*/
;(function ($) {
    var pluginName = 'panelslider';
    var defaults =  {
        prevBtn: 'Previous',
        nextBtn: 'Next',
        enabledClickSlide: true,
        initIndex: 0,
        touchThreshold: 5
    };

    function Plugin ( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this.$slides = this.$element.find('>li');
        this.length = this.$slides.length;
        this.listWidth = 0;
        this.current = this.settings.initIndex;


        this.dragging = false;
        this.touchObject = {};

        this.init();
    }

    Plugin.prototype = {
        init: function () {
            this.createPanelSlider();
        },
        initializeEvents: function() {
            var _ = this;
            _.$element.on('touchstart.panelslider mousedown.panelslider', {
                action: 'start'
            }, _.swipeHandler);
            _.$element.on('touchmove.panelslider mousemove.panelslider', {
                action: 'move'
            }, _.swipeHandler);
            _.$element.on('touchend.panelslider mouseup.panelslider', {
                action: 'end'
            }, _.swipeHandler);
            _.$element.on('touchcancel.panelslider mouseleave.panelslider', {
                action: 'end'
            }, _.swipeHandler);
            $('*[draggable!=true]', _.$subwrapper).on('dragstart', function(e){ e.preventDefault(); });
        },
        swipeHandler: function(event) {
            var _ = $(this).data('plugin_panelslider');

            _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
                event.originalEvent.touches.length : 1;

            // _.touchObject.minSwipe = _.listWidth / _.settings.touchThreshold;
            _.touchObject.minSwipe = _.$subwrapper.width() / _.settings.touchThreshold;

            switch (event.data.action) {
                case 'start':
                    _.swipeStart(event);
                    break;
                case 'move':
                    _.swipeMove(event);
                    break;
                case 'end':
                    _.swipeEnd(event);
                    break;
            }
        },
        swipeDirection: function() {
            var xDist, yDist, r, swipeAngle, _ = this;

            xDist = _.touchObject.startX - _.touchObject.curX;
            yDist = _.touchObject.startY - _.touchObject.curY;
            r = Math.atan2(yDist, xDist);

            swipeAngle = Math.round(r * 180 / Math.PI);
            if (swipeAngle < 0) {
                swipeAngle = 360 - Math.abs(swipeAngle);
            }

            if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
                return 'left';
            }
            if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
                return 'left';
            }
            if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
                return 'right';
            }

            return 'vertical';
        },
        swipeStart: function(event) {
            var _ = this,
                touches;

            if (_.touchObject.fingerCount !== 1 || _.length <= 1) { //_.options.slidesToShow === 1 ??
                _.touchObject = {};
                return false;
            }

            if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
                touches = event.originalEvent.touches[0];
            }

            _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
            _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

            _.dragging = true;

        },
        swipeMove: function(event) {
            var _ = this,
                curLeft, swipeDirection, positionOffset, touches;

            touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

            if (!_.dragging || touches && touches.length !== 1) {
                return false;
            }

            curLeft = _.currentPosX;

            _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
            _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

            _.touchObject.swipeLength = Math.round(Math.sqrt(
                Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

            swipeDirection = _.swipeDirection();

            if (swipeDirection === 'vertical') {
                return;
            }

            if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
                event.preventDefault();
            }

            positionOffset = 1 * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);

            _.swipeLeft = curLeft + _.touchObject.swipeLength * positionOffset;

             _.applyCSStransform(_.$element, _.swipeLeft);

        },

        swipeEnd: function(event) {
            var _ = this, slideCount;
            _.dragging = false;
            _.shouldClick = (_.touchObject.swipeLength > 10) ? false : true;

            if (_.touchObject.curX === undefined) {
                return false;
            }
            if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {
                switch (_.swipeDirection()) {
                    case 'left':
                        _.goToNext();
                        _.currentDirection = 0;
                        _.touchObject = {};
                        break;

                    case 'right':
                        _.goToPrev();
                        _.currentDirection = 1;
                        _.touchObject = {};
                        break;
                }
            } else {
                if(_.touchObject.startX !== _.touchObject.curX) {
                    _.goToSlide(_.current);
                    _.touchObject = {};
                }
            }
        },

        createPanelSlider: function () {
            var oCfg = this;
            var elm = oCfg.element;

            //Add Wrapper div
            oCfg.$element.wrap('<div class="panelslider-subwrapper"><div class="panelslider-wrapper"></div></div>');
            oCfg.$subwrapper = oCfg.$element.closest('.panelslider-subwrapper');

            //Create prev/next buttons
            oCfg.createPrevNextBtns();
            
            //Apply active element
            var nInitIndex = oCfg.settings.initIndex;
            if(oCfg.settings.initIndex === 'center'){
                nInitIndex = oCfg.getMiddleSlide();
                this.current = nInitIndex;
            }
            oCfg.setActiveSlide(nInitIndex);

            //Set panel wrapper (ul) width
            oCfg.setWrapperWidth();

            //Handle click Slide: change active slide
            if(oCfg.settings.enabledClickSlide){
                oCfg.$slides.on('click', function(e){
                    if(!$(this).hasClass('active')){
                        e.preventDefault();
                        oCfg.goToSlide($(this).index());
                    }
                });
            }

            //Init Position Active Slide + Handle resize
            oCfg.positionActiveSlide();
            if(typeof Foundation === 'object'){
                $(window).on('resize', Foundation.utils.throttle(function(e){
                    oCfg.positionActiveSlide();
                }, 300));
            }else{
                $(window).on('resize', function(e){
                    oCfg.positionActiveSlide();
                });
            }


            //handle Event (draggable)
            oCfg.initializeEvents();
        },

        checkBtnsState: function () {
            var oCfg = this;
            
            //if only 1 slide: disabled both btns
            //if first slide active: disabled prev btn and enabled next btn
            //if last slide active: disabled next btn and enabled prev btn
            if(oCfg.length === 1){
                oCfg.$prev.addClass('panelslider-disabled').attr('disabled', true);
                oCfg.$next.addClass('panelslider-disabled').attr('disabled', true);
            } else if(oCfg.$slides.eq(0).hasClass('active')){
                oCfg.$prev.addClass('panelslider-disabled').attr('disabled', true);
                oCfg.$next.removeClass('panelslider-disabled').attr('disabled', false);
            } else if(oCfg.$slides.eq(oCfg.length-1).hasClass('active')){
                oCfg.$prev.removeClass('panelslider-disabled').attr('disabled', false);
                oCfg.$next.addClass('panelslider-disabled').attr('disabled', true);
            } else {
                oCfg.$prev.removeClass('panelslider-disabled').attr('disabled', false);
                oCfg.$next.removeClass('panelslider-disabled').attr('disabled', false);
            }
        },

        goToSlide: function (nIndex){
            var oCfg = this;
            oCfg.setActiveSlide(nIndex);
        },
        goToPrev: function (){
            var oCfg = this;
            oCfg.setActiveSlide(oCfg.current-1);
        },
        goToNext: function (){
            var oCfg = this;
            oCfg.setActiveSlide(oCfg.current+1);
        },

        createPrevNextBtns: function () {
            var oCfg = this;
            oCfg.$subwrapper.prepend('<button type="button" data-role="none" class="panelslider-prev">'+oCfg.settings.prevBtn+'</button>');
            oCfg.$subwrapper.append('<button type="button" data-role="none" class="panelslider-next">'+oCfg.settings.nextBtn+'</button>');

            oCfg.$prev = oCfg.$subwrapper.find('.panelslider-prev');
            oCfg.$next = oCfg.$subwrapper.find('.panelslider-next');

            oCfg.checkBtnsState();
            oCfg.$prev.on('click', function(e) {
                e.preventDefault();
                if(!$(this).hasClass('panelslider-disabled')){
                    oCfg.goToPrev();
                }
            });
            oCfg.$next.on('click', function(e) {
                e.preventDefault();
                if(!$(this).hasClass('panelslider-disabled')){
                    oCfg.goToNext();
                }
            });
        },
        
        applyCSStransform: function ($elm, X, Y, Z) {
            X = X || 0;
            Y = Y || 0;
            Z = Z || 0;

            $elm.css('-webkit-transform','translate3d('+X+'px, '+Y+'px, '+Z+'px)');
            $elm.css('-moz-transform','translate3d('+X+'px, '+Y+'px, '+Z+'px)');
            $elm.css('-ms-transform','translate3d('+X+'px, '+Y+'px, '+Z+'px)');
            $elm.css('-o-transform','translate3d('+X+'px, '+Y+'px, '+Z+'px)');
            $elm.css('transform','translate3d('+X+'px, '+Y+'px, '+Z+'px)');
        },
        positionActiveSlide: function () {
            var oCfg = this;
            //ul position = wrapper width / 2 - (active slide offset X) - active slide /2
            var nWrapperWidth = oCfg.$subwrapper.find('.panelslider-wrapper').width(); 
            var nWrapperHalf = nWrapperWidth/2;
            var nActiveSlideOffset = oCfg.$current.get(0).offsetLeft;
            var nActiveSlideHalf = oCfg.$current.width()/2;

            var nPositionX = nWrapperHalf-nActiveSlideOffset-nActiveSlideHalf;

            /*@TODO: DEBUG FOR LARGE SCREEN :/ */
            // var nSliderOffset = oCfg.$slides.eq(0).get(0).offsetLeft;
            oCfg.applyCSStransform(oCfg.$element, nPositionX);
            oCfg.currentPosX = nPositionX;
            // oCfg.$element.css('transform','translate3d('+nPositionX+'px, 0, 0)');
        },

        setActiveSlide: function (nIndex) {
            var oCfg = this;
            oCfg.$slides.removeClass('active');
            oCfg.$slides.eq(nIndex).addClass('active');
            oCfg.current = nIndex;
            oCfg.$current = oCfg.$slides.eq(nIndex);
            oCfg.checkBtnsState();

            oCfg.positionActiveSlide();
        },
        setWrapperWidth: function () {
            var oCfg = this;
            var nWidth = 0;
            oCfg.$slides.each(function(){
                nWidth+= $(this).outerWidth(true);
            });
            oCfg.$element.css('width', nWidth);
            oCfg.listWidth = nWidth;

        },
        getMiddleSlide: function () {
           var oCfg = this;
           return (oCfg.length%2)? ((oCfg.length+1)/2)-1 : (oCfg.length/2)-1;
        }
    };

    $.fn[ pluginName ] = function ( options ) {
        this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });
        return this;
    };
})( jQuery );