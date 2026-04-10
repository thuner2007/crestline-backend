import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding blog posts...');

  // Sample blog posts with multi-language translations
  const blogPosts = [
    {
      author: 'RevSticks Team',
      writingDate: new Date('2025-11-01T10:00:00Z'),
      active: true,
      translations: [
        {
          language: 'en',
          title: 'Welcome to RevSticks Blog',
          markdownContent: `# Welcome to RevSticks Blog

We're excited to launch our new blog where we'll share updates, tips, and stories about our products.

## What to Expect

Stay tuned for:

- Product announcements
- Design inspiration
- Community highlights
- Behind-the-scenes content

Thank you for being part of our journey!`,
        },
        {
          language: 'de',
          title: 'Willkommen im RevSticks Blog',
          markdownContent: `# Willkommen im RevSticks Blog

Wir freuen uns, unseren neuen Blog zu starten, in dem wir Updates, Tipps und Geschichten über unsere Produkte teilen werden.

## Was Sie erwartet

Bleiben Sie dran für:

- Produktankündigungen
- Design-Inspiration
- Community-Highlights
- Hinter-den-Kulissen-Inhalte

Vielen Dank, dass Sie Teil unserer Reise sind!`,
        },
        {
          language: 'fr',
          title: 'Bienvenue sur le blog RevSticks',
          markdownContent: `# Bienvenue sur le blog RevSticks

Nous sommes ravis de lancer notre nouveau blog où nous partagerons des actualités, des conseils et des histoires sur nos produits.

## À quoi s'attendre

Restez à l'écoute pour :

- Annonces de produits
- Inspiration de design
- Points forts de la communauté
- Contenu en coulisses

Merci de faire partie de notre aventure !`,
        },
        {
          language: 'it',
          title: 'Benvenuti nel blog di RevSticks',
          markdownContent: `# Benvenuti nel blog di RevSticks

Siamo entusiasti di lanciare il nostro nuovo blog dove condivideremo aggiornamenti, consigli e storie sui nostri prodotti.

## Cosa aspettarsi

Rimanete sintonizzati per:

- Annunci di prodotti
- Ispirazione per il design
- Momenti salienti della comunità
- Contenuti dietro le quinte

Grazie per far parte del nostro viaggio!`,
        },
      ],
      images: [],
      links: [
        {
          translations: [
            {
              language: 'en',
              url: 'https://revsticks.com/en',
              title: 'Visit Our Website',
            },
            {
              language: 'de',
              url: 'https://revsticks.com/de',
              title: 'Besuchen Sie unsere Website',
            },
            {
              language: 'fr',
              url: 'https://revsticks.com/fr',
              title: 'Visitez notre site web',
            },
            {
              language: 'it',
              url: 'https://revsticks.com/it',
              title: 'Visita il nostro sito web',
            },
          ],
        },
      ],
    },
    {
      author: 'Design Team',
      writingDate: new Date('2025-10-28T14:30:00Z'),
      active: true,
      translations: [
        {
          language: 'en',
          title: 'How to Choose the Perfect Sticker Design',
          markdownContent: `# How to Choose the Perfect Sticker Design

Choosing the right sticker design can make all the difference. Here are our top tips:

## Consider Your Style

Think about what represents you or your brand best. Bold graphics? Minimalist designs? Text-based art?

## Size Matters

Consider where you'll place your sticker. Larger designs work great for laptops, while smaller ones are perfect for water bottles.

## Color Psychology

Colors evoke emotions. Choose colors that align with your message.

Ready to create your perfect sticker? Check out our design gallery for inspiration!`,
        },
        {
          language: 'de',
          title: 'So wählen Sie das perfekte Sticker-Design',
          markdownContent: `# So wählen Sie das perfekte Sticker-Design

Die Wahl des richtigen Sticker-Designs kann den entscheidenden Unterschied machen. Hier sind unsere Top-Tipps:

## Berücksichtigen Sie Ihren Stil

Denken Sie darüber nach, was Sie oder Ihre Marke am besten repräsentiert. Mutige Grafiken? Minimalistische Designs? Textbasierte Kunst?

## Die Größe ist wichtig

Überlegen Sie, wo Sie Ihren Sticker platzieren werden. Größere Designs eignen sich hervorragend für Laptops, während kleinere perfekt für Wasserflaschen sind.

## Farbpsychologie

Farben wecken Emotionen. Wählen Sie Farben, die zu Ihrer Botschaft passen.

Bereit, Ihren perfekten Sticker zu erstellen? Schauen Sie sich unsere Design-Galerie zur Inspiration an!`,
        },
        {
          language: 'fr',
          title: 'Comment choisir le design de sticker parfait',
          markdownContent: `# Comment choisir le design de sticker parfait

Choisir le bon design de sticker peut faire toute la différence. Voici nos meilleurs conseils :

## Considérez votre style

Pensez à ce qui vous représente le mieux, vous ou votre marque. Graphiques audacieux ? Designs minimalistes ? Art basé sur le texte ?

## La taille compte

Réfléchissez à l'endroit où vous placerez votre sticker. Les grands designs sont parfaits pour les ordinateurs portables, tandis que les plus petits sont parfaits pour les bouteilles d'eau.

## Psychologie des couleurs

Les couleurs évoquent des émotions. Choisissez des couleurs qui correspondent à votre message.

Prêt à créer votre sticker parfait ? Consultez notre galerie de designs pour vous inspirer !`,
        },
        {
          language: 'it',
          title: 'Come scegliere il design perfetto per adesivi',
          markdownContent: `# Come scegliere il design perfetto per adesivi

Scegliere il design giusto per gli adesivi può fare tutta la differenza. Ecco i nostri migliori consigli:

## Considera il tuo stile

Pensa a ciò che rappresenta meglio te o il tuo marchio. Grafica audace? Design minimalisti? Arte basata sul testo?

## Le dimensioni contano

Considera dove posizionerai il tuo adesivo. I design più grandi sono perfetti per i laptop, mentre quelli più piccoli sono perfetti per le bottiglie d'acqua.

## Psicologia del colore

I colori evocano emozioni. Scegli colori che si allineano con il tuo messaggio.

Pronto a creare il tuo adesivo perfetto? Dai un'occhiata alla nostra galleria di design per l'ispirazione!`,
        },
      ],
      images: [],
      links: [
        {
          translations: [
            {
              language: 'en',
              url: 'https://revsticks.com/en/gallery',
              title: 'Design Gallery',
            },
            {
              language: 'de',
              url: 'https://revsticks.com/de/galerie',
              title: 'Design-Galerie',
            },
            {
              language: 'fr',
              url: 'https://revsticks.com/fr/galerie',
              title: 'Galerie de designs',
            },
            {
              language: 'it',
              url: 'https://revsticks.com/it/galleria',
              title: 'Galleria di design',
            },
          ],
        },
        {
          translations: [
            {
              language: 'en',
              url: 'https://revsticks.com/en/custom',
              title: 'Create Custom Sticker',
            },
            {
              language: 'de',
              url: 'https://revsticks.com/de/anpassen',
              title: 'Erstelle individuellen Sticker',
            },
            {
              language: 'fr',
              url: 'https://revsticks.com/fr/personnaliser',
              title: 'Créer un autocollant personnalisé',
            },
            {
              language: 'it',
              url: 'https://revsticks.com/it/personalizza',
              title: 'Crea adesivo personalizzato',
            },
          ],
        },
      ],
    },
    {
      author: 'Product Team',
      writingDate: new Date('2025-10-15T09:00:00Z'),
      active: false,
      translations: [
        {
          language: 'en',
          title: 'New Product Line Coming Soon',
          markdownContent: `# New Product Line Coming Soon

We're working on something special! Our new product line will feature:

- Premium vinyl materials
- Weather-resistant finishes
- Eco-friendly options
- Custom shapes and sizes

Stay tuned for the official launch date!`,
        },
        {
          language: 'de',
          title: 'Neue Produktlinie kommt bald',
          markdownContent: `# Neue Produktlinie kommt bald

Wir arbeiten an etwas Besonderem! Unsere neue Produktlinie wird Folgendes bieten:

- Premium-Vinyl-Materialien
- Wetterbeständige Oberflächen
- Umweltfreundliche Optionen
- Individuelle Formen und Größen

Bleiben Sie dran für das offizielle Startdatum!`,
        },
      ],
      images: [],
      links: [],
    },
    {
      author: 'Community Manager',
      writingDate: new Date('2025-11-05T16:45:00Z'),
      active: true,
      translations: [
        {
          language: 'en',
          title: 'Customer Spotlight: Creative Uses for Stickers',
          markdownContent: `# Customer Spotlight: Creative Uses for Stickers

Our community never ceases to amaze us with their creativity! Here are some of the most innovative ways our customers use their stickers:

## 1. Laptop Personalization

Transform your boring laptop into a unique piece of art that reflects your personality.

## 2. Water Bottle Decoration

Stay hydrated in style with custom water bottle designs.

## 3. Phone Case Customization

Make your phone truly yours with eye-catching sticker combinations.

## 4. Skateboard Art

Express yourself while riding with unique board designs.

Share your creations with us using **#RevSticksCreative**!`,
        },
        {
          language: 'de',
          title: 'Kunden im Rampenlicht: Kreative Verwendungen für Sticker',
          markdownContent: `# Kunden im Rampenlicht: Kreative Verwendungen für Sticker

Unsere Community überrascht uns immer wieder mit ihrer Kreativität! Hier sind einige der innovativsten Wege, wie unsere Kunden ihre Sticker verwenden:

## 1. Laptop-Personalisierung

Verwandeln Sie Ihren langweiligen Laptop in ein einzigartiges Kunstwerk, das Ihre Persönlichkeit widerspiegelt.

## 2. Wasserflaschen-Dekoration

Bleiben Sie stilvoll hydratisiert mit individuellen Wasserflaschen-Designs.

## 3. Handyhüllen-Anpassung

Machen Sie Ihr Handy wirklich zu Ihrem mit auffälligen Sticker-Kombinationen.

## 4. Skateboard-Kunst

Drücken Sie sich beim Fahren mit einzigartigen Board-Designs aus.

Teilen Sie Ihre Kreationen mit uns unter **#RevSticksCreative**!`,
        },
        {
          language: 'fr',
          title: 'Zoom sur les clients : Utilisations créatives des stickers',
          markdownContent: `# Zoom sur les clients : Utilisations créatives des stickers

Notre communauté ne cesse de nous étonner par sa créativité ! Voici quelques-unes des façons les plus innovantes dont nos clients utilisent leurs stickers :

## 1. Personnalisation d'ordinateur portable

Transformez votre ordinateur portable ennuyeux en une œuvre d'art unique qui reflète votre personnalité.

## 2. Décoration de bouteille d'eau

Restez hydraté avec style grâce à des designs de bouteilles d'eau personnalisés.

## 3. Personnalisation de coque de téléphone

Rendez votre téléphone vraiment unique avec des combinaisons de stickers accrocheuses.

## 4. Art de skateboard

Exprimez-vous en roulant avec des designs de planche uniques.

Partagez vos créations avec nous en utilisant **#RevSticksCreative** !`,
        },
        {
          language: 'it',
          title: 'Clienti in primo piano: Usi creativi per adesivi',
          markdownContent: `# Clienti in primo piano: Usi creativi per adesivi

La nostra comunità non smette mai di stupirci con la sua creatività! Ecco alcuni dei modi più innovativi in cui i nostri clienti utilizzano i loro adesivi:

## 1. Personalizzazione del laptop

Trasforma il tuo laptop noioso in un pezzo d'arte unico che riflette la tua personalità.

## 2. Decorazione della bottiglia d'acqua

Rimani idratato con stile con design personalizzati per bottiglie d'acqua.

## 3. Personalizzazione della custodia del telefono

Rendi il tuo telefono veramente tuo con combinazioni di adesivi accattivanti.

## 4. Arte per skateboard

Esprimi te stesso mentre cavalchi con design unici per tavola.

Condividi le tue creazioni con noi usando **#RevSticksCreative**!`,
        },
      ],
      images: [],
      links: [
        {
          translations: [
            {
              language: 'en',
              url: 'https://instagram.com/revsticks',
              title: 'Follow us on Instagram',
            },
            {
              language: 'de',
              url: 'https://instagram.com/revsticks',
              title: 'Folgen Sie uns auf Instagram',
            },
            {
              language: 'fr',
              url: 'https://instagram.com/revsticks',
              title: 'Suivez-nous sur Instagram',
            },
            {
              language: 'it',
              url: 'https://instagram.com/revsticks',
              title: 'Seguici su Instagram',
            },
          ],
        },
        {
          translations: [
            {
              language: 'en',
              url: 'https://revsticks.com/en/community',
              title: 'Join Our Community',
            },
            {
              language: 'de',
              url: 'https://revsticks.com/de/gemeinschaft',
              title: 'Treten Sie unserer Community bei',
            },
            {
              language: 'fr',
              url: 'https://revsticks.com/fr/communaute',
              title: 'Rejoignez notre communauté',
            },
            {
              language: 'it',
              url: 'https://revsticks.com/it/comunita',
              title: 'Unisciti alla nostra comunità',
            },
          ],
        },
      ],
    },
  ];

  // Create blog posts
  for (const post of blogPosts) {
    const { translations, images, links, ...postData } = post;

    try {
      const createdPost = await prisma.blog_post.create({
        data: {
          ...postData,
          translations: {
            create: translations,
          },
          images: images.length > 0 ? { create: images } : undefined,
          links:
            links.length > 0
              ? {
                  create: links.map((link) => ({
                    translations: {
                      create: link.translations,
                    },
                  })),
                }
              : undefined,
        },
        include: {
          translations: true,
          images: true,
          links: {
            include: {
              translations: true,
            },
          },
        },
      });

      console.log(
        `✅ Created blog post: "${createdPost.translations[0]?.title}" (${createdPost.translations.length} languages)`,
      );
    } catch (error) {
      console.error(`❌ Error creating blog post:`, error);
    }
  }

  console.log('✨ Blog posts seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
