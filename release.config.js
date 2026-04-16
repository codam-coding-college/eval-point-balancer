module.exports = {
	branches: ["main"],
	repositoryUrl: "https://github.com/codam-internal/eval-point-balancer.git",
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/github",
	]
};
