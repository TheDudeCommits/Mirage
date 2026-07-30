const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ContentAuthenticityRegistry", function () {
  let registry;
  let owner;
  let verifier1;
  let verifier2;

  // Test data
  const testContent = "This is test content for AI detection";
  const testIpfsCid = "QmTest123abc456def789ghi";
  const DetectionType = {
    TEXT: 0,
    IMAGE: 1,
    VIDEO: 2,
    VOICE: 3,
  };

  beforeEach(async function () {
    // Get signers
    [owner, verifier1, verifier2] = await ethers.getSigners();

    // Deploy contract
    const ContentAuthenticityRegistry = await ethers.getContractFactory(
      "ContentAuthenticityRegistry"
    );
    registry = await ContentAuthenticityRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero verifications", async function () {
      expect(await registry.totalVerifications()).to.equal(0);
    });

    it("Should initialize with zero verification fee", async function () {
      expect(await registry.verificationFee()).to.equal(0);
    });
  });

  describe("Content Hash Generation", function () {
    it("Should generate consistent content hash", async function () {
      const hash1 = await registry.generateContentHash(testContent);
      const hash2 = await registry.generateContentHash(testContent);
      expect(hash1).to.equal(hash2);
    });

    it("Should generate different hashes for different content", async function () {
      const hash1 = await registry.generateContentHash("content1");
      const hash2 = await registry.generateContentHash("content2");
      expect(hash1).to.not.equal(hash2);
    });
  });

  describe("Register Verification", function () {
    it("Should successfully register a verification", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry
          .connect(verifier1)
          .registerVerification(
            contentHash,
            testIpfsCid,
            true,
            85,
            DetectionType.TEXT
          )
      )
        .to.emit(registry, "ContentVerified")
        .withArgs(
          contentHash,
          testIpfsCid,
          verifier1.address,
          true,
          85,
          DetectionType.TEXT,
          await time.latest()
        );

      expect(await registry.totalVerifications()).to.equal(1);
    });

    it("Should store verification details correctly", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await registry
        .connect(verifier1)
        .registerVerification(
          contentHash,
          testIpfsCid,
          false,
          92,
          DetectionType.IMAGE
        );

      const verification = await registry.getVerification(contentHash);

      expect(verification.contentHash).to.equal(contentHash);
      expect(verification.ipfsCid).to.equal(testIpfsCid);
      expect(verification.verifier).to.equal(verifier1.address);
      expect(verification.isAuthentic).to.equal(false);
      expect(verification.confidenceScore).to.equal(92);
      expect(verification.detectionType).to.equal(DetectionType.IMAGE);
      expect(verification.exists).to.equal(true);
    });

    it("Should fail with invalid content hash", async function () {
      await expect(
        registry.registerVerification(
          ethers.ZeroHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        )
      ).to.be.revertedWith("Invalid content hash");
    });

    it("Should fail with empty IPFS CID", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry.registerVerification(
          contentHash,
          "",
          true,
          85,
          DetectionType.TEXT
        )
      ).to.be.revertedWith("IPFS CID required");
    });

    it("Should fail with invalid confidence score", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          101,
          DetectionType.TEXT
        )
      ).to.be.revertedWith("Invalid confidence score");
    });

    it("Should fail when content already verified", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await registry.registerVerification(
        contentHash,
        testIpfsCid,
        true,
        85,
        DetectionType.TEXT
      );

      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        )
      ).to.be.revertedWith("Already verified");
    });

    it("Should require verification fee when set", async function () {
      const fee = ethers.parseEther("0.01");
      await registry.setVerificationFee(fee);

      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry
          .connect(verifier1)
          .registerVerification(
            contentHash,
            testIpfsCid,
            true,
            85,
            DetectionType.TEXT
          )
      ).to.be.revertedWith("Insufficient fee");

      // Should succeed with correct fee
      await expect(
        registry
          .connect(verifier1)
          .registerVerification(
            contentHash,
            testIpfsCid,
            true,
            85,
            DetectionType.TEXT,
            { value: fee }
          )
      ).to.not.be.reverted;
    });
  });

  describe("Batch Registration", function () {
    it("Should successfully register multiple verifications", async function () {
      const contentHashes = [
        await registry.generateContentHash("content1"),
        await registry.generateContentHash("content2"),
        await registry.generateContentHash("content3"),
      ];

      const ipfsCids = ["Qm111", "Qm222", "Qm333"];
      const isAuthentic = [true, false, true];
      const scores = [80, 90, 75];
      const types = [
        DetectionType.TEXT,
        DetectionType.IMAGE,
        DetectionType.VOICE,
      ];

      await registry
        .connect(verifier1)
        .batchRegisterVerifications(
          contentHashes,
          ipfsCids,
          isAuthentic,
          scores,
          types
        );

      expect(await registry.totalVerifications()).to.equal(3);
    });

    it("Should fail with mismatched array lengths", async function () {
      const contentHashes = [await registry.generateContentHash("content1")];
      const ipfsCids = ["Qm111", "Qm222"]; // Wrong length

      await expect(
        registry.batchRegisterVerifications(
          contentHashes,
          ipfsCids,
          [true],
          [80],
          [DetectionType.TEXT]
        )
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should fail with batch size > 50", async function () {
      const largeArray = new Array(51).fill(ethers.ZeroHash);

      await expect(
        registry.batchRegisterVerifications(
          largeArray,
          largeArray,
          new Array(51).fill(true),
          new Array(51).fill(80),
          new Array(51).fill(DetectionType.TEXT)
        )
      ).to.be.revertedWith("Invalid batch size");
    });

    it("Should calculate correct fee for batch", async function () {
      const fee = ethers.parseEther("0.01");
      await registry.setVerificationFee(fee);

      const contentHashes = [
        await registry.generateContentHash("content1"),
        await registry.generateContentHash("content2"),
      ];

      await expect(
        registry
          .connect(verifier1)
          .batchRegisterVerifications(
            contentHashes,
            ["Qm111", "Qm222"],
            [true, false],
            [80, 90],
            [DetectionType.TEXT, DetectionType.IMAGE],
            { value: fee } // Only 1x fee, should fail
          )
      ).to.be.revertedWith("Insufficient fee");

      // Should succeed with correct fee (2x)
      await expect(
        registry
          .connect(verifier1)
          .batchRegisterVerifications(
            contentHashes,
            ["Qm111", "Qm222"],
            [true, false],
            [80, 90],
            [DetectionType.TEXT, DetectionType.IMAGE],
            { value: fee * 2n }
          )
      ).to.not.be.reverted;
    });
  });

  describe("Update Verification", function () {
    it("Should allow verifier to update IPFS CID", async function () {
      const contentHash = await registry.generateContentHash(testContent);
      const newIpfsCid = "QmNewCid123";

      await registry
        .connect(verifier1)
        .registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        );

      const updateTransaction = await registry
        .connect(verifier1)
        .updateVerificationCid(contentHash, newIpfsCid);
      const updateReceipt = await updateTransaction.wait();
      const updateBlock = await ethers.provider.getBlock(
        updateReceipt!.blockNumber,
      );

      await expect(updateTransaction)
        .to.emit(registry, "VerificationUpdated")
        .withArgs(contentHash, newIpfsCid, updateBlock!.timestamp);

      const verification = await registry.getVerification(contentHash);
      expect(verification.ipfsCid).to.equal(newIpfsCid);
    });

    it("Should fail when non-verifier tries to update", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await registry
        .connect(verifier1)
        .registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        );

      await expect(
        registry
          .connect(verifier2)
          .updateVerificationCid(contentHash, "QmNewCid")
      ).to.be.revertedWith("Not the verifier");
    });

    it("Should fail with empty IPFS CID", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await registry
        .connect(verifier1)
        .registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        );

      await expect(
        registry.connect(verifier1).updateVerificationCid(contentHash, "")
      ).to.be.revertedWith("IPFS CID required");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Register some test verifications
      for (let i = 0; i < 3; i++) {
        const contentHash = await registry.generateContentHash(`content${i}`);
        await registry
          .connect(verifier1)
          .registerVerification(
            contentHash,
            `QmCid${i}`,
            i % 2 === 0,
            80 + i,
            DetectionType.TEXT
          );
      }
    });

    it("Should return user verifications", async function () {
      const userVerifications = await registry.getUserVerifications(
        verifier1.address
      );
      expect(userVerifications.length).to.equal(3);
    });

    it("Should return correct user verification count", async function () {
      const count = await registry.getUserVerificationCount(verifier1.address);
      expect(count).to.equal(3);
    });

    it("Should return paginated verifications", async function () {
      const page1 = await registry.getPaginatedVerifications(0, 2);
      expect(page1.length).to.equal(2);

      const page2 = await registry.getPaginatedVerifications(2, 2);
      expect(page2.length).to.equal(1);
    });

    it("Should check if content is verified", async function () {
      const contentHash = await registry.generateContentHash("content0");
      expect(await registry.isVerified(contentHash)).to.equal(true);

      const unknownHash = await registry.generateContentHash("unknown");
      expect(await registry.isVerified(unknownHash)).to.equal(false);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set verification fee", async function () {
      const newFee = ethers.parseEther("0.05");

      await expect(registry.setVerificationFee(newFee))
        .to.emit(registry, "FeeUpdated")
        .withArgs(0, newFee);

      expect(await registry.verificationFee()).to.equal(newFee);
    });

    it("Should fail when non-owner tries to set fee", async function () {
      await expect(
        registry.connect(verifier1).setVerificationFee(ethers.parseEther("0.05"))
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw fees", async function () {
      const fee = ethers.parseEther("0.01");
      await registry.setVerificationFee(fee);

      const contentHash = await registry.generateContentHash(testContent);
      await registry
        .connect(verifier1)
        .registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT,
          { value: fee }
        );

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await expect(registry.withdrawFees())
        .to.emit(registry, "FundsWithdrawn")
        .withArgs(owner.address, fee);

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });

    it("Should fail when non-owner tries to withdraw", async function () {
      await expect(
        registry.connect(verifier1).withdrawFees()
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause contract", async function () {
      await registry.pause();

      const contentHash = await registry.generateContentHash(testContent);
      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        )
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should allow owner to unpause contract", async function () {
      await registry.pause();
      await registry.unpause();

      const contentHash = await registry.generateContentHash(testContent);
      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          85,
          DetectionType.TEXT
        )
      ).to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum confidence score", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          100,
          DetectionType.TEXT
        )
      ).to.not.be.reverted;
    });

    it("Should handle minimum confidence score", async function () {
      const contentHash = await registry.generateContentHash(testContent);

      await expect(
        registry.registerVerification(
          contentHash,
          testIpfsCid,
          true,
          0,
          DetectionType.TEXT
        )
      ).to.not.be.reverted;
    });

    it("Should handle all detection types", async function () {
      for (let type = 0; type <= 3; type++) {
        const contentHash = await registry.generateContentHash(`content_type_${type}`);
        await expect(
          registry.registerVerification(
            contentHash,
            testIpfsCid,
            true,
            85,
            type
          )
        ).to.not.be.reverted;
      }
    });
  });
});
