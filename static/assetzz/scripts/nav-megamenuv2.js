// nav-megamenusv2.js
//  MegaMenu Navigation Support
//  June2020 logical and structural rewrite

var vMenu = {
    // configuration:
    activator_selector: '#burgermenu',
    deactivator_selector: '.JQcloseMM',
    menu_outer_container_selector: '#megabox',
    menu_section_selector: '.JQMegaMenuCtrl',
    menu_relevantcontainer_selectors: [
        'div.menu-main',
        '#megabox',
        '#JQmegamenu_content'
    ],
    remember_last_menu_state: false, // true=open menu in previous state, false=open menu to initial state

    // internal variables:
    navDebug: false,
    menuopen: false,
    initial_active_menu_num: 1
}

// initialize the menu -- only call once 
vMenu.initialize = function() {

    // get the data-navid of the main menu item that is in on state
    if ($('ul.nav-menu.megamenu').find('li.on').length > 0) {
        this.initial_active_menu_num = $('ul.nav-menu.megamenu').find('li.on a').attr('data-navid');
        if (this.navDebug) console.log('found current menu id ' + this.initial_active_menu_num);
    }

    // initialize the active menu item so it's ready when activated
    this.setActive(this.initial_active_menu_num);

    // install click handler for activator:
    $(this.activator_selector).on('click', function(e) {
        vMenu.open();
    });

    // install click handler for deactivator:
    $(this.deactivator_selector).on('click', function(e) {
        vMenu.close();
    });

    // install click handler for menu interaction:
    $(this.menu_section_selector).on('click', function(e) {
        e.preventDefault();
        mega_menu_2_open = $(this).attr('data-navid');
        vMenu.setActive(mega_menu_2_open);
    });

    // install global click handler to close menu on clicks outside of menu area
    $(document).on('mouseup', function(e) {
        vMenu.processGlobalClick(e);
    });

}

// open the menu
vMenu.open = function() {
    var m = $(this.menu_outer_container_selector);
    if (!m.is(":visible")) {
        //m.slideDown();
        m.fadeIn();
        m.menu_is_open = true;

        // if we aren't to remember last menu state, set to default
        if (!this.remember_last_menu_state) {
            this.setActive(this.initial_active_menu_num);
        }
        $(this.activator_selector).removeClass('menu-icon-closed').addClass('menu-icon-open');
    }
}

// close the menu
vMenu.close = function() {
    var m = $(this.menu_outer_container_selector);
    if (m.is(":visible")) {
        //m.slideUp();
        m.fadeOut();
        m.menu_is_open = false;
        $(this.activator_selector).removeClass('menu-icon-open').addClass('menu-icon-closed');

    }
}

// update menu with the specified main menu item selected
vMenu.setActive = function(navid) {

    // clear on state for all menu items
    $('ul.nav-menu.megamenu').find('li.on').removeClass('on');

    // hide and clear on state for all mega menu containers
    $('div.megacontainer').each(function(index) {
        if ($(this).hasClass('on')) {
            $(this).hide().removeClass('on');
        }
    });

    // set on state for the specified menu item
    var $div2Display = $('#JQmegamenu_content div.megacontainer[data-navid=' + navid + "]");
    $div2Display.show().addClass('on');

    // clear active class from all 
    $('ul.nav-menu.megamenu a.active').removeClass('active').addClass('inactive');

    // set active for the specified menu item
    var menuitem = $('ul.nav-menu.megamenu').find('li a[data-navid=' + navid + "]");
    menuitem.removeClass('inactive').addClass('active');

}

vMenu.processGlobalClick = function(e) {

    // determine if the click is in any menu-relevant container:
    var offclick = true; // assume click is outside 
    vMenu.menu_relevantcontainer_selectors.forEach(function(s) {
        var container = $(s);
        if (container.is(e.target)) {
            // click is directly on relevant element
            offclick = false;
        }
        if (container.has(e.target).length != 0) {
            // clicked on something inside a relevant element
            offclick = false;
        }
    });
    if (offclick) {
        vMenu.close();
    }

}

$(function() {
    vMenu.initialize();
});