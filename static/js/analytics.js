// Google Analytics click tracking. Shows up in GA under Reports > Engagement > Events.
//   join_now_click             any link to /join (Join Now buttons)
//   membership_checkout_click  the Trackman membership sign-up link (the money click)
//   member_booking_click       Member Booking links (existing members booking the bay)
//   directions_click           Get Directions / Apple Maps
//   google_reviews_click       Read All on Google / Leave a Review
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || typeof gtag !== 'function') return;
    const url = new URL(a.href, location.href);

    let name = null;
    if (url.hostname === 'booking.trackmangolf.com') {
        name = url.pathname.includes('/memberships') ? 'membership_checkout_click' : 'member_booking_click';
    } else if (url.hostname === location.hostname && /^\/join\/?$/.test(url.pathname)) {
        name = 'join_now_click';
    } else if (url.hostname === 'maps.apple.com' || (url.hostname.endsWith('google.com') && url.pathname.startsWith('/maps/dir'))) {
        name = 'directions_click';
    } else if (a.closest('#reviews, #join-proof, [data-rv-inline]')) {
        name = 'google_reviews_click';
    }
    if (name) gtag('event', name, { link_text: a.textContent.trim().slice(0, 60), page: location.pathname });
});
