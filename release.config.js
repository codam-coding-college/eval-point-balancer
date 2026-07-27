module.exports = {
	branches: ["main"],
	repositoryUrl: "https://github.com/codam-coding-college/eval-point-balancer.git",
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/github",
	]
};
