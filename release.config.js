module.exports = {
	branches: ["main"],
	repositoryUrl: "https://github.com/codam-coding-college/eval-point-balancer.git",
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		[
			"@semantic-release/exec",
			{
				publishCmd: 'docker tag ${REGISTRY}/${IMAGE_NAME} ${REGISTRY}/${IMAGE_NAME}:${nextRelease.version} && docker push ${REGISTRY}/${IMAGE_NAME}:${nextRelease.version}'
			}
		],
		[
			"@semantic-release/npm",
			{
				npmPublish: false
			}
		],
		"@semantic-release/github",
		[
			"@semantic-release/git",
			{
				assets: ["package.json"],
				message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
			}
		]
	]
};
