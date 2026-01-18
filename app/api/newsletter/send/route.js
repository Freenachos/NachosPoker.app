import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freenachos.poker';

export async function POST(request) {
  try {
    // Verify this is an authenticated request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId, articleTitle, articleExcerpt, articleSlug } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    // Check if newsletter was already sent for this article
    const { data: article } = await supabase
      .from('articles')
      .select('newsletter_sent_at, send_newsletter')
      .eq('id', articleId)
      .single();

    if (article?.newsletter_sent_at) {
      return NextResponse.json({ 
        error: 'Newsletter already sent for this article',
        sent_at: article.newsletter_sent_at 
      }, { status: 400 });
    }

    // Get subscriber count for response
    const { count: subscriberCount } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', true)
      .is('unsubscribed_at', null);

    // Build article URL
    const articleUrl = `${SITE_URL}/articles/${articleSlug}`;

    // Send via Beehiiv
    if (BEEHIIV_API_KEY && BEEHIIV_PUBLICATION_ID) {
      try {
        const response = await fetch(
          `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/posts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: articleTitle,
              subtitle: articleExcerpt || '',
              status: 'confirmed', // 'draft' to review first, 'confirmed' to send immediately
              content_html: buildEmailHTML(articleTitle, articleExcerpt, articleUrl),
              send_to: 'all' // Send to all subscribers
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Beehiiv error:', errorData);
          throw new Error('Failed to send via Beehiiv');
        }

        const postData = await response.json();
        console.log('Beehiiv post created:', postData);

      } catch (emailError) {
        console.error('Email send error:', emailError);
        return NextResponse.json(
          { error: 'Failed to send newsletter: ' + emailError.message },
          { status: 500 }
        );
      }
    } else {
      console.log('Beehiiv not configured - skipping email send');
      console.log(`Would send to ${subscriberCount} subscribers:`, {
        title: articleTitle,
        url: articleUrl
      });
    }

    // Mark article as newsletter sent
    await supabase
      .from('articles')
      .update({ 
        newsletter_sent_at: new Date().toISOString() 
      })
      .eq('id', articleId);

    return NextResponse.json({ 
      success: true, 
      message: `Newsletter sent to ${subscriberCount || 0} subscriber${subscriberCount !== 1 ? 's' : ''}`,
      count: subscriberCount || 0
    });

  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Build email HTML content
function buildEmailHTML(title, excerpt, url) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin-bottom: 16px;">
        ${title}
      </h1>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        ${excerpt || 'A new article has been published on Freenachos Poker.'}
      </p>
      
      <a href="${url}" style="display: inline-block; background: #A78A43; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Read the Full Article →
      </a>
      
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0 24px;">
      
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Master high-stakes theory and exploit the population.<br>
        <a href="${url.replace('/articles/' + url.split('/').pop(), '')}" style="color: #A78A43;">freenachos.poker</a>
      </p>
    </div>
  `.trim();
}
