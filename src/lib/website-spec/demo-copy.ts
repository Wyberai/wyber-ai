import type { OwnerFacts, SiteCopy } from './types'

// DEMO ONLY. Stand-in for the copy step (a model writes this in the real pipeline). Written to the same rules the copy
// validator enforces: owner facts only, no invented claims. hello@example.com is a reserved placeholder, not a real address.

export interface DemoSite { key: string; prompt: string; seed: string; facts: OwnerFacts; copy: SiteCopy }

export const DEMOS: DemoSite[] = [
  {
    key: 'dental',
    prompt: 'Website for a family dental clinic in Ahmedabad for check-ups, braces and root canals',
    seed: 'demo-1',
    facts: { city: 'Ahmedabad', email: 'hello@example.com' },
    copy: {
      brand: 'Family dental clinic',
      seo: {
        title: 'Dental clinic in Ahmedabad | Check-ups, braces, root canals',
        description: 'A family dental clinic in Ahmedabad offering check-ups, braces and root canal treatment. Ask a question or book a visit by email.',
      },
      hero: {
        eyebrow: 'Ahmedabad',
        headline: 'Dental care for the whole family, in Ahmedabad.',
        sub: 'Check-ups, braces and root canal treatment from a family clinic. Every step is explained before it starts, so you always know what comes next.',
        cta: 'Book a visit',
        secondary: 'See what we do',
        imageAlt: 'A dentist and a young patient looking at a tooth model together in a bright, calm treatment room',
      },
      sections: {
        services: {
          eyebrow: 'Treatments',
          title: 'What we do',
          description: 'Three things, done carefully, for children and adults.',
          items: [
            { title: 'Check-ups and cleaning', text: 'A routine look at your teeth and gums, a clean, and advice you can follow at home.' },
            { title: 'Braces and aligners', text: 'Straightening for children and adults, planned after an examination and reviewed along the way.' },
            { title: 'Root canal treatment', text: 'Treatment to save a painful or infected tooth, explained to you before it begins.' },
          ],
        },
        how: {
          eyebrow: 'Your visit',
          title: 'What to expect',
          items: [
            { title: 'Tell us what is wrong', text: 'Message the clinic or fill in the form. Say what you have noticed and when it began.' },
            { title: 'Get seen', text: 'We look, we explain what we find, and we answer your questions in plain words.' },
            { title: 'Leave with a plan', text: 'You go home knowing what to do next, what it involves and when to come back.' },
          ],
        },
        about: {
          eyebrow: 'Our approach',
          title: 'How we look after you',
          paragraphs: [
            'We treat families, so we expect nervous children and nervous adults. We go slowly, show you what we are about to do, and stop when you ask us to.',
            'Nothing is done without explaining it first. If a treatment can wait, we will say so.',
          ],
        },
        faq: {
          eyebrow: 'Good to know',
          title: 'Questions we are asked',
          faq: [
            { question: 'How do I book a visit?', answer: 'Send us a message using the form on this page. Tell us what you need and when you are free, and we will reply to arrange a time.' },
            { question: 'Do you treat children?', answer: 'Yes, we see children as well as adults. Tell us the age when you write so we can plan the visit around them.' },
            { question: 'What should I bring?', answer: 'Bring any earlier dental records or X-rays you have, and a list of medicines you take. If you have none of these, come anyway.' },
            { question: 'How long does a first visit take?', answer: 'It depends on what you need. A first visit is mostly talking and looking, and we will tell you what to expect when we reply.' },
          ],
        },
        visit: { eyebrow: 'Find us', title: 'Where we are' },
        contact: {
          eyebrow: 'Get in touch',
          title: 'Send us a message',
          description: 'Tell us what you need and we will reply to arrange a time that suits you.',
          button: 'Send enquiry',
        },
      },
    },
  },
  {
    key: 'rice',
    prompt: 'Website for a basmati and sona masoori rice exporter in Hyderabad supplying wholesale buyers',
    seed: 'demo-1',
    facts: { city: 'Hyderabad', email: 'hello@example.com' },
    copy: {
      brand: 'Rice exporter, Hyderabad',
      seo: {
        title: 'Rice exporter in Hyderabad | Basmati, sona masoori',
        description: 'Basmati and sona masoori rice for wholesale buyers, supplied from Hyderabad. Send your requirement and receive a quote with the packing details.',
      },
      hero: {
        eyebrow: 'Wholesale rice',
        headline: 'Basmati and sona masoori for wholesale buyers.',
        sub: 'Rice supplied from Hyderabad to importers and distributors. Tell us the variety, the quantity and the packing you need, and we will send a quote.',
        cta: 'Request a quote',
        secondary: 'See the range',
        imageAlt: 'Open sacks of long-grain rice in a warehouse, with a hand lifting a scoop of grain into the light',
      },
      sections: {
        range: {
          eyebrow: 'The range',
          title: 'What we supply',
          description: 'Two main varieties, packed to your order. If you buy something else, ask, because the range is shaped by what buyers need and not by a fixed list printed once and left alone.',
          items: [
            { title: 'Basmati rice', text: 'Long, slender, aromatic grain, used for biryani and pulao.', meta: 'Long grain' },
            { title: 'Sona masoori rice', text: 'A light, medium-grain rice for everyday cooking across South India.', meta: 'Medium grain' },
            { title: 'Other varieties', text: 'Ask us if you need a different variety. We will tell you honestly whether we can supply it.', meta: 'On request' },
          ],
        },
        buyers: {
          eyebrow: 'Who we supply',
          title: 'Built for buyers, not shoppers',
          description: 'We work with businesses that buy in volume and need the same grade every time, so everything is agreed in writing before an order moves.',
          items: [
            { title: 'Importers and distributors', text: 'Larger orders with packing and labelling agreed in advance with you.' },
            { title: 'Wholesalers', text: 'Regular supply for stores and markets, planned around your buying cycle.' },
            { title: 'Food businesses', text: 'Steady supply for kitchens, caterers and institutions that cook at volume.' },
          ],
        },
        quote: {
          eyebrow: 'How it works',
          title: 'Get a quote',
          description: 'There is no catalogue price list because the right price depends on the variety, the quantity, the packing and where it is going. A short message is enough to start the conversation, and we reply with a quote that spells out each of those.',
          items: [
            { title: 'Send your requirement', text: 'Tell us the variety, the quantity and where it needs to go.' },
            { title: 'Receive a quote', text: 'We reply with a price, the packing options and the time needed.' },
            { title: 'Confirm and dispatch', text: 'Once you agree, we pack your order and arrange dispatch with you.' },
          ],
        },
        faq: {
          eyebrow: 'Good to know',
          title: 'Questions buyers ask',
          description: 'The things wholesale buyers usually want to know before they send a requirement, answered as plainly as we can without promising what we have not agreed with you.',
          faq: [
            { question: 'What is the minimum order?', answer: 'The minimum order depends on the variety and the packing. Send your requirement and we will confirm it with your quote.' },
            { question: 'Can I get a sample?', answer: 'Ask when you send your enquiry. We will tell you whether a sample can be arranged for the variety you want.' },
            { question: 'Do you ship abroad?', answer: 'We supply wholesale buyers from Hyderabad. Tell us the destination and we will explain what is possible.' },
            { question: 'How do I get a price?', answer: 'Use the form on this page. Prices depend on the variety, quantity and packing, so we quote for each order.' },
          ],
        },
        contact: {
          eyebrow: 'Request a quote',
          title: 'Tell us what you need',
          description: 'Variety, quantity and destination are enough to start.',
          button: 'Send enquiry',
        },
      },
    },
  },
  {
    key: 'meetup',
    prompt: 'Website for a two-day startup meetup in Pune with talks, demos and a hiring corner',
    seed: 'demo-1',
    facts: { city: 'Pune', email: 'hello@example.com' },
    copy: {
      brand: 'Startup meetup, Pune',
      seo: {
        title: 'Startup meetup in Pune | Talks, demos, hiring corner',
        description: 'A two-day startup meetup in Pune with talks, product demos and a hiring corner. Register your interest to hear the details first.',
      },
      hero: {
        eyebrow: 'Startup meetup',
        headline: 'Two days of startup talks and demos in Pune.',
        sub: 'Founders and builders in one room: talks you can learn from, products you can try, and a corner for people who are hiring and people who want to be hired.',
        cta: 'Register your interest',
        secondary: 'See what happens',
        imageAlt: '',
      },
      sections: {
        agenda: {
          eyebrow: 'The two days',
          title: 'Three parts, one room',
          items: [
            { title: 'Talks', text: 'Short talks from people who have built things, with time for your questions afterwards.', meta: 'Learn' },
            { title: 'Demos', text: 'Founders show what they have built and let you try it, so you see the product and not the pitch.', meta: 'Try' },
            { title: 'Hiring corner', text: 'A space for teams that are hiring and people who are looking, with no forms and no queue.', meta: 'Meet' },
          ],
        },
        expect: {
          eyebrow: 'On the day',
          title: 'What to expect',
          description: 'A relaxed format built around conversation, not a rigid schedule of sessions you have to sit through.',
          items: [
            { title: 'Arrive and settle in', text: 'Find a seat, meet the people around you and get your bearings before the first talk begins.' },
            { title: 'Listen and try things', text: 'Move between short talks and demo tables at your own pace, and ask whoever is standing there anything you like.' },
            { title: 'Meet people', text: 'Stay for conversations in the hiring corner and in the gaps between sessions, where most introductions happen.' },
          ],
        },
        about: {
          eyebrow: 'Who it is for',
          title: 'Come if you build, back or join startups',
          paragraphs: [
            'This is for founders, engineers, designers and anyone curious about how a young company gets made. You do not need to be launching anything to come.',
            'We will share the programme and the venue details with everyone who registers their interest.',
          ],
        },
        visit: { eyebrow: 'Venue', title: 'Where it happens' },
        faq: {
          eyebrow: 'Good to know',
          title: 'Questions before you register',
          faq: [
            { question: 'Who can attend?', answer: 'Anyone interested in startups can attend. Founders, engineers, designers, students and people who are hiring are all welcome.' },
            { question: 'How do I register?', answer: 'Use the form on this page to register your interest. We will write back with the details as soon as they are confirmed.' },
            { question: 'Where is it held?', answer: 'The meetup is in Pune. We will confirm the exact venue with everyone who registers their interest.' },
            { question: 'Can I show my product?', answer: 'Yes. Tell us what you have built in your message and we will reply about demo space.' },
          ],
        },
        contact: {
          eyebrow: 'Register',
          title: 'Register your interest',
          description: 'Leave your details and a line about what brings you. We will write back with the programme.',
          button: 'Register',
        },
      },
    },
  },
]
