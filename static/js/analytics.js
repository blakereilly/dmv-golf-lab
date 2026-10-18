// Google Analytics click tracking. Shows up in GA under Reports > Engagement > Events.
//   join_now_click             any link to /join (Join Now buttons)
//   membership_checkout_click  the Trackman membership sign-up link (the money click)
//   member_booking_click       Member Booking links (existing members booking the bay)
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || typeof gtag !== 'function') return;
    const url = new URL(a.href, location.href);

    let name = null;
    if (url.hostname === 'booking.trackmangolf.com') {
        name = url.pathname.includes('/memberships') ? 'membership_checkout_click' : 'member_booking_click';
    } else if (url.hostname === location.hostname && /^\/join\/?$/.test(url.pathname)) {
        name = 'join_now_click';
    }
    if (name) gtag('event', name, { link_text: a.textContent.trim().slice(0, 60), page: location.pathname });
});
