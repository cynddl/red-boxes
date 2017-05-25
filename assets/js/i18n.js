// THREE-LINGUAL
var interfaceLang = 'en';
var browserLang = navigator.language.slice(0,2);
if (browserLang == 'fr') {
    interfaceLang = 'fr';
}
if (browserLang == 'nl') {
    interfaceLang = 'nl';
}
var i18n = {
    en: {
        'title' : 'Find a red letterbox near you',
        'pitch' : 'Belgian red letterboxes: you never know quite where they are and when they get serviced. Now there’s an app that tells you.',
        'action': 'Find a red box!',
        'and' : 'And',
        'read-blog-post': 'Read the blog post on how we did it'
    },
    fr: {
        'title' : 'Trouvez une boîte aux lettres rouge près de vous',
        'pitch' : 'Les boîtes aux lettres rouges belges: vous ne savez jamais vraiment où elles se trouvent et quand elles sont relevées? Il existe maintenant une application qui vous l’indique.',
        'action': 'Trouvez une boîte aux lettres rouge!',
        'and' : 'Et',
        'read-blog-post': 'Lisez l’article de blog sur la façon dont nous avons construit l’application'
    },
    nl: {
        'title' : 'Vind een rode brievenbus dichtbij',
        'pitch' : 'De rode brievenbussen in België: Waar zijn ze? en hoe laat worden ze gelicht? Nu is er een app die het weet!',
        'action': 'Vind een rode brievenbus!',
        'and' : 'En',
        'read-blog-post': 'Hier lees je hoe en waarom we de app gebouwd hebben'
    }
};
Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (item) {
    var key = item.getAttribute('data-i18n');
    item.innerText = i18n[interfaceLang][key];
});
