module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      url: ['http://localhost/']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.5 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    },
    upload: { target: 'temporary-public-storage' }
  }
};
