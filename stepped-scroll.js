function SteppedScroll({container = '.scrollable', itemSelector = '.scroll', currentSelector = '.current', prevSelector = '.prev', activeSelector = '.active', closeButtonSelector = '.close-active-post', activatedSelector = '.activated', unactivableClass = 'unactivable', animationLockDelay = 2500, mobileActivationBreakpoint = 768, mobileOnly = true, addCloseButton = null, itemClicked = function (e, item, data) {}} = {}) {
    let mutation = null;

    let swipeAttached = false;

    const activatedClass = activatedSelector.substr(1);

    const currentClass = currentSelector.substr(1);
    const prevClass = prevSelector.substr(1);
    const activeClass = activeSelector.substr(1);

    const closeButtonClass = closeButtonSelector.substr(1);

    let currentIndex = null;

    if ((typeof container) === 'string') {
        container = document.querySelector(container);
    }

    if (!container || !(container instanceof HTMLElement)) {
        throw new Error('Container element not found.');
    }

    if ((typeof itemSelector) !== 'string') {
        throw new Error('Item selector must be a string.');
    }

    if ((typeof prevSelector) !== 'string') {
        throw new Error('Item selector must be a string.');
    }

    if (addCloseButton == null) {
        addCloseButton = function (container, button, closeButtonClass) {
            if (button == null) {
                button = document.createElement('button');
            }

            button.type = 'button';
            button.classList.add(closeButtonClass);

            button.innerHTML = '&times;';

            container.insertBefore(button, container.childNodes[0]);

            return button;
        }
    }

    const that = this;

    function scrollToElement({container = container, current} = {}) {
        /*const margin = parseInt(getComputedStyle(current).marginTop);

        container.scrollTop = (current.offsetTop - container.offsetTop);

        if ((current.clientHeight + margin) <= container.clientHeight) {
            container.scrollTop -= margin;
        }*/
    }

    function checkActiveChild() {
        let activeChild = container.querySelector(itemSelector + activeSelector);

        return (activeChild) ? true : false;
    }

    function keyScroll(e) {
        const keys = {
            up: [
                38, // up
                33 // pageup
            ],
            down: [
                40, // down,
                34 // pagedown
            ],
            start: [
                36
            ],
            end: [
                35
            ]
        };

        const key = e.keyCode || e.which;

        if (keys.up.indexOf(key) > -1) {
            that.toPrev();
        }
        else if (keys.down.indexOf(key) > -1) {
            that.toNext();
        }
        else if (keys.start.indexOf(key) > -1) {
            that.toStart();
        }
        else if (keys.end.indexOf(key) > -1) {
            that.toEnd();
        }
    }

    function mouseScroll(e) {
        e.preventDefault();
        e.returnValue = false;

        function stopScrollAcceleration(container, e) {
            e.stopPropagation();
            container.classList.add('animated');
        }

        const delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;

        if (!container.classList.contains('animated')) {
            if (delta <= -1) {
                stopScrollAcceleration(container, e);

                that.toPrev();
            }
            else if (delta >= 1) {
                stopScrollAcceleration(container, e);

                that.toNext();
            }

            setTimeout(() => {
                container.classList.remove('animated');
            }, animationLockDelay);
        }
        else {
            return false;
        }
    }

    function clickHandler(e) {
        let target = e.target;

        while (target && !target.isSameNode(container.querySelector(itemSelector + currentSelector))) {
            target = target.parentNode;
        }

        //if (!target.classList.contains(unactivableClass)) {
        //    e.preventDefault();
        //    e.stopPropagation();
        //    e.stopImmediatePropagation();
        //}

        if (!target.classList.contains(activeClass)) {
            if (target && !target.classList.contains(unactivableClass)) {
                setActive({
                    current: target,
                    state: true
                });

                let activatedElementEvent = null;

                if (typeof window.CustomEvent !== 'function') {
                    activatedElementEvent = document.createEvent('elementactivated');

                    activatedElementEvent.initCustomEvent('elementactivated', false, false, {
                        target: current
                    });
                }
                else {
                    activatedElementEvent = new CustomEvent('elementactivated', {
                        detail: {
                            target: current
                        }
                    });
                }

                document.dispatchEvent(activatedElementEvent);
            }
        }
    }

    function swipeHandler(e) {
        if (e.detail.direction === 'up') {
            that.toNext();
        }
        else if (e.detail.direction === 'down') {
            that.toPrev();
        }
    }

    function attachEvents() {
        if (container.classList.contains(activatedClass)) {
            window.addEventListener('keydown', keyScroll);
            window.addEventListener('DOMMouseScroll', mouseScroll);
            window.addEventListener('wheel', mouseScroll);
            window.addEventListener('mousewheel', mouseScroll);
        }
    }

    function detachEvents() {
        window.removeEventListener('keydown', keyScroll);
        window.removeEventListener('DOMMouseScroll', mouseScroll);
        window.removeEventListener('wheel', mouseScroll);
        window.removeEventListener('mousewheel', mouseScroll);
    }

    function setActive({current = null, state = false}) {
        if (current && !current.classList.contains(unactivableClass)) {
            if (state && !current.classList.contains(activeClass)) {
                container.classList.add(activeClass);

                if (current.querySelector(closeButtonClass) === null){
                    let closeButton = document.createElement('button');

                    addCloseButton(current, closeButton, closeButtonClass);

                    closeButton.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        setActive({
                            current: e.target.parentNode,
                            state: false
                        });

                        let deactivatedElementEvent = null;

                        if (typeof window.CustomEvent !== 'function') {
                            deactivatedElementEvent = document.createEvent('elementdeactivated');

                            deactivatedElementEvent.initCustomEvent('elementdeactivated', false, false, {
                                target: current
                            });

                        }
                        else {
                            deactivatedElementEvent = new CustomEvent('elementdeactivated', {
                                detail: {
                                    target: current
                                }
                            });
                        }

                        document.dispatchEvent(deactivatedElementEvent);

                        e.target.parentNode.removeChild(e.target);
                    }, false);
                }

                // Sets current to active
                const margin = parseInt(getComputedStyle(current).marginTop);

                if (margin !== 0) {
                    container.scrollTop += margin;
                }

                current.classList.add(activeClass);
                detachEvents();
            }
            else {
                container.classList.remove(activeClass);
                current.classList.remove(activeClass);

                if (current.hasClickHandler == null || !current.hasClickHandler)
                {
                    current.addEventListener('click', clickHandler);
                    current.hasClickHandler = true;
                }

                const margin = parseInt(getComputedStyle(current).marginTop);

                if (margin !== 0) {
                    container.scrollTop -= margin;
                }

                attachEvents();
            }
        }
    }

    const screenSizeDetection = (function screenSizeDetectionFn() {
        if (mobileOnly) {
            const screenWidth = (screen.width === window.innerWidth) ? screen.width : window.innerWidth;

            if (screenWidth < mobileActivationBreakpoint) {
                container.classList.add(activatedClass);
                window.scrollTo(0, 0);
                if (!swipeAttached) {
                    swipeAttached = attachSwipeEvent({
                        element: container,
                        itemSelector: itemSelector,
                        currentSelector: currentSelector,
                        closeButtonSelector: closeButtonSelector,
                        activeSelector: activeSelector
                    });
                }

                container.addEventListener('swipe', swipeHandler);

                attachEvents();
            }
            else {
                container.classList.remove(activatedClass);

                container.removeEventListener('swipe', swipeHandler);

                detachEvents();
            }
        }

        return screenSizeDetectionFn;
    })();

    window.addEventListener('resize', function () {
        screenSizeDetection();
    });

    let items = container.querySelectorAll(itemSelector) || [];

    function getCurrent() {
        const c = container.querySelector(currentSelector);

        if (c) {
            let i = 0;
            for (; i < items.length; i++) {
                if (items[i].isSameNode(c)) {
                    currentIndex = i;
                    break;
                }
            }

            // Se non è stato trovato, viene resettato
            if (currentIndex !== i) {
                currentIndex = 0;
            }

            //setActive({
            //    current: c,
            //    state: c.classList.contains(activeClass)
            //});

            return c;
        }

        if (items.length > 0) {
            return ((items) => {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].classList.contains(currentClass)) {
                        for (let j = i - 1; j >= 0; j--) {
                            items[j].classList.add(prevClass);
                        }

                        currentIndex = i;

                        setActive({
                            current: items[i]
                        });

                        scrollToElement(items[i]);

                        return items[i];
                    }
                }

                return null;
            })(items) || ((item) => {
                item.classList.add(currentClass);

                currentIndex = 0;

                setActive({
                    current: item
                });

                return item;
            })(items[0]);
        }

        return null;
    }

    let current = getCurrent();

    if (mutation !== false) {
        if ('MutationObserver' in window) {
            window.MutationObserver = window.MutationObserver || window.WebkitMutationObserver;

            mutation = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    if (m.type === 'childList') {
                        items = container.querySelectorAll(itemSelector);

                        current = getCurrent();
                    }
                });
            });

            mutation.observe(container, {childList: true, subtree: true});
        }
        else {
            mutation = false;

            container.addEventListener('DOMNodeInserted DOMNodeRemoved', () => {
                items = container.querySelectorAll(itemSelector);

                current = getCurrent();
            });
        }
    }

    attachEvents();



    this.toStart = () => {
        if (container.classList.contains(activatedClass) && !checkActiveChild()) {
            current.classList.remove(currentClass);

            for (let i = items.length - 1; i >= 0; i--) {
                items[i].classList.remove(prevClass);

                current = items[i];
            }

            current.classList.add(currentClass);
            currentIndex = 0;

            setActive({
                container: container,
                current: current
            });

            scrollToElement({
                container: container,
                current: current
            });
        }
    };

    this.toEnd = () => {
        if (container.classList.contains(activatedClass) && !checkActiveChild()) {
            current.classList.remove(currentClass);

            for (let i = currentIndex; i < items.length; i++) {
                items[i].classList.add(prevClass);

                current = items[i];
            }

            current.classList.add(currentClass);
            currentIndex = items.length - 1;

            setActive({
                current: current
            });

            scrollToElement({
                container: container,
                current: current
            });

            let lastReachedEvent = null;

            if (typeof window.Event !== 'function') {
                lastReachedEvent = document.createEvent('lastreached');

                lastReachedEvent.initEvent('lastreached', false, false);

            }
            else {
                lastReachedEvent = new Event('lastreached');
            }

            document.dispatchEvent(lastReachedEvent);
        }
    };

    this.toPrev = () => {
        if (container.classList.contains(activatedClass) && !checkActiveChild()) {
            let previous = items[currentIndex - 1];

            if (previous) {
                current.classList.remove(currentClass);

                previous.classList.remove(prevClass);
                previous.classList.add(currentClass);

                current = previous;
                --currentIndex;

                setActive({
                    current: current
                });

                scrollToElement({
                    container: container,
                    current: current
                });
            }
        }
    };

    this.toNext = () => {
        if (container.classList.contains(activatedClass) && !checkActiveChild()) {
            // Trova l'indice dell'elemento corrente;
            /*for (let i = 0; i < items.length - 1; i++) {
                if (items[i].isSameNode(current)) {
                    index = i;
                    break;
                }

                index = -1;
            }*/

            if (/*index > -1*/ (currentIndex + 1) < items.length) {
                current.classList.remove(currentClass);
                current.classList.add(prevClass);

                current = items[++currentIndex];

                setActive({
                    current: current
                });

                current.classList.add(currentClass);

                let nextStepEvent = null;

                if (typeof window.CustomEvent !== 'function') {
                    nextStepEvent = document.createEvent('nextstep');

                    nextStepEvent.initCustomEvent('nextstep', false, false, {
                        currentIndex: currentIndex,
                        itemsLength: items.length
                    });

                }
                else {
                    nextStepEvent = new CustomEvent('nextstep', {
                        detail: {
                            currentIndex: currentIndex,
                            itemsLength: items.length
                        }
                    });
                }

                document.dispatchEvent(nextStepEvent);

                scrollToElement({
                    container: container,
                    current: current
                });
            }
        }
    };

    this.getItems = function () {
        return items;
    };

    this.getCurrentIndex = function () {
        return currentIndex;
    };

    this.isActive = function () {
        return container.classList.contains(activatedClass);
    };

    document.addEventListener('click', function (e) {
        let target = e.target;

        while (target !== null) {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (target.isSameNode(item)) {
                    itemClicked(e, item, {
                        active: item.classList.contains(activeClass),
                        unactivable: item.classList.contains(unactivableClass)
                    });
                    break;
                }
            }

            target = target.parentNode;
        }
    })
}
