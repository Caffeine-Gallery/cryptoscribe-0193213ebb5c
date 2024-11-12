import { backend } from "declarations/backend";

let quill;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Quill
    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Write your post content...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Load initial posts
    loadPosts();

    // Event Listeners
    document.getElementById('newPostBtn').addEventListener('click', showPostForm);
    document.getElementById('cancelBtn').addEventListener('click', hidePostForm);
    document.getElementById('createPostForm').addEventListener('submit', handleSubmit);
});

async function loadPosts() {
    const loading = document.getElementById('loading');
    const postsContainer = document.getElementById('posts');
    
    try {
        loading.classList.remove('hidden');
        const posts = await backend.getPosts();
        
        const postsHTML = posts.map(post => createPostHTML(post)).join('');
        postsContainer.innerHTML = postsHTML || '<p class="no-posts">No posts yet. Be the first to write one!</p>';
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p class="error">Failed to load posts. Please try again later.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

function createPostHTML(post) {
    const date = new Date(Number(post.timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return `
        <article class="post">
            <h2>${escapeHtml(post.title)}</h2>
            <div class="post-meta">
                <span class="author">By ${escapeHtml(post.author)}</span>
                <span class="date">${date.toLocaleDateString()}</span>
            </div>
            <div class="post-content">${post.body}</div>
        </article>
    `;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showPostForm() {
    document.getElementById('postForm').classList.remove('hidden');
    document.getElementById('newPostBtn').classList.add('hidden');
}

function hidePostForm() {
    document.getElementById('postForm').classList.add('hidden');
    document.getElementById('newPostBtn').classList.remove('hidden');
    document.getElementById('createPostForm').reset();
    quill.setContents([]);
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const body = quill.root.innerHTML;
    
    if (!title || !author || !body) {
        alert('Please fill in all fields');
        return;
    }

    try {
        document.querySelector('button[type="submit"]').disabled = true;
        await backend.createPost(title, body, author);
        hidePostForm();
        await loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    } finally {
        document.querySelector('button[type="submit"]').disabled = false;
    }
}
