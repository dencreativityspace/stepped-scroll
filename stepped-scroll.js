function SteppedScroll({container = '.scrollable', itemSelector = '.scroll', currentSelector = '.current', prevSelector = '.prev', activeSelector = '.active', closeButtonSelector = '.close-active-post', unactivableClass = 'unactivable', animationLockDelay = 2500} = {}) {
    let lastY = 0;
    let currentY = 0;
    
    let isAnimating = false;
    
    let mutation = null;
    
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
    
    const that = this;
    
    attachSwipeEvent({
        element: container,
        itemSelector: itemSelector,
        currentSelector: currentSelector,
        closeButtonSelector: closeButtonSelector,
        activeSelector: activeSelector
    });

    container.addEventListener('swipe', (e) => {
        if (e.detail.direction === 'up') {
            that.toNext();
        }
        else if (e.detail.direction === 'down') {
            that.toPrev();
        }
    })
    
    function scrollToElement({container = container, current} = {}) {
        container.scrollTop = current.offsetTop - container.offsetTop;
        //window.scrollTop += container.scrollTop;
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
        }
        
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

        if (target) {
            setActive({
                current: target,
                state: true
            });
        }
    }
    
    function setActive({current = null, state = false}) {
        if (current && !current.classList.contains(unactivableClass)) {
            if (state && !current.classList.contains(activeClass)) {
                // Sets current to active
                let closeButton = document.createElement('button');
            
                closeButton.type = 'button';
                closeButton.classList.add(closeButtonClass);
                
                closeButton.innerHTML = '&times;';
                
                current.insertBefore(closeButton, current.childNodes[0]);
                
                closeButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setActive({
                        current: e.target.parentNode,
                        state: false
                    });
                    
                    e.target.parentNode.removeChild(e.target);
                }, false);
                
                current.classList.add(activeClass);
                current.removeEventListener('click', clickHandler);
                
                window.removeEventListener('keydown', keyScroll);
                window.removeEventListener('DOMMouseScroll', mouseScroll);
                window.removeEventListener('wheel', mouseScroll);
                window.removeEventListener('mousewheel', mouseScroll);
            }
            else {
                current.classList.remove(activeClass);
                
                current.addEventListener('click', clickHandler);
                
                window.addEventListener('keydown', keyScroll);
                window.addEventListener('DOMMouseScroll', mouseScroll);
                window.addEventListener('wheel', mouseScroll);
                window.addEventListener('mousewheel', mouseScroll);
            }
        }
    }
    
    let items = container.querySelectorAll(itemSelector) || [];
    
    function getCurrent() {
        const c = container.querySelector(currentSelector);
        
        if (c) {
            currentIndex = 0;
            
            setActive({
                current: c
            });
            
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
                        
                        scrollToElem(items[i]);
                        
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
            
            mutation = new MutationObserver((mutations, observer) => {
                mutations.forEach((m) => {
                    if (m.type === 'childList') {
                        items = container.querySelectorAll(itemSelector);
                        
                        current = getCurrent();
                    }
                });
            });
            
            mutation.observe(container, {childList: true});
        }
        else {
            mutation = false;
            
            container.addEventListener('DOMNodeInserted DOMNodeRemoved', (e) => {
                items = container.querySelectorAll(itemSelector);
                
                current = getCurrent();
            });
        }
    }
    
    window.addEventListener('keydown', keyScroll);
    window.addEventListener('DOMMouseScroll', mouseScroll);
    window.addEventListener('wheel', mouseScroll);
    window.addEventListener('mousewheel', mouseScroll);

    
    // Exposed methods:
    
    this.toStart = () => {
        if (!checkActiveChild()) {
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
    }
    
    this.toEnd = () => {
        if (!checkActiveChild()) {
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
        }
    }
    
    this.toPrev = () => {
        if (!checkActiveChild()) {
            let previous = current.previousElementSibling;

            while (previous && !previous.classList.contains('scroll')) {
                previous = current.previousElementSibling;
            }

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
    }
    
    this.toNext = () => {
        if (!checkActiveChild()) {
            let index = -1;

            for (let i = 0; i < items.length - 1; i++) {
                if (items[i].isSameNode(current)) {
                    index = i;
                    break;
                }

                index = -1;
            }

            if (index > -1) {
                current.classList.remove(currentClass);
                current.classList.add(prevClass);

                current = items[index + 1];
                ++currentIndex;

                setActive({
                    current: current
                });

                current.classList.add(currentClass);

                scrollToElement({
                    container: container,
                    current: current
                });
            }
        }
    }
}
