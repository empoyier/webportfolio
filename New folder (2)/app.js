const campaignSettings = {
  goalAmount: 25000,
  mealCost: 50,
  fallbackDonors: [
    { amount: 500, donor_name: "Community Friend" },
    { amount: 250, donor_name: "Anonymous" },
    { amount: 1000, donor_name: "Volunteer Team" }
  ],
  memories: [
    { src: "601354662_845861784732578_9044284520343399287_n.jpg", alt: "Project Smile memory 1" },
    { src: "601952541_845861951399228_5288269780214533364_n.jpg", alt: "Project Smile memory 2" },
    { src: "603929750_845861934732563_7443955011391490477_n.jpg", alt: "Project Smile memory 3" },
    { src: "603945252_845861798065910_1993820439682446761_n.jpg", alt: "Project Smile memory 4" },
    { src: "605115545_845861918065898_2632086138189042944_n.jpg", alt: "Project Smile memory 5" },
    { src: "605116787_845861894732567_8052037683268726928_n.jpg", alt: "Project Smile memory 6" },
    { src: "605118577_845861821399241_742912982518774667_n.jpg", alt: "Project Smile memory 7" },
    { src: "480519360_610664394918986_6640259628278800745_n.jpg", alt: "Project Smile memory 8" }
  ]
};

const elements = {
  donationForm: document.getElementById("donationForm"),
  donorCount: document.getElementById("donorCount"),
  averageGift: document.getElementById("averageGift"),
  raisedAmount: document.getElementById("raisedAmount"),
  goalAmount: document.getElementById("goalAmount"),
  mealCount: document.getElementById("mealCount"),
  progressFill: document.getElementById("progressFill"),
  formStatus: document.getElementById("formStatus"),
  submitButton: document.getElementById("submitButton"),
  gcashCard: document.getElementById("gcashCard"),
  qrAmountValue: document.getElementById("qrAmountValue"),
  memoryPrevCard: document.getElementById("memoryPrevCard"),
  memoryCard: document.getElementById("memoryCard"),
  memoryNextCard: document.getElementById("memoryNextCard"),
  memoryPrevImage: document.getElementById("memoryPrevImage"),
  memoryImage: document.getElementById("memoryImage"),
  memoryNextImage: document.getElementById("memoryNextImage"),
  memoryNumber: document.getElementById("memoryNumber"),
  memoryCaption: document.getElementById("memoryCaption"),
  memoryDots: document.getElementById("memoryDots")
};

let activeMemoryIndex = 0;
let memoryIntervalId = null;
let latestDonationAmount = 50;

const config = window.PROJECT_SMILE_CONFIG || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

elements.goalAmount.textContent = `of ${formatCurrency(campaignSettings.goalAmount)} goal`;

initialize();

async function initialize() {
  updateQrAmount(latestDonationAmount);
  initializeMemories();
  const donations = await loadDonations();
  updateDashboard(donations);
  bindDonationForm();
}

async function loadDonations() {
  if (!supabaseClient) {
    return campaignSettings.fallbackDonors;
  }

  try {
    const { data, error } = await supabaseClient
      .from("donations")
      .select("donor_name, amount")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    showStatus("Live database could not be loaded. Showing demo totals for now.", "error");
    return campaignSettings.fallbackDonors;
  }
}

function bindDonationForm() {
  elements.donationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(elements.donationForm);
    const amount = Number(formData.get("amount"));

    if (amount <= 0) {
      showStatus("Please enter a valid donation amount.", "error");
      return;
    }

    const donation = {
      donor_name: formData.get("name").toString().trim(),
      donor_email: formData.get("email").toString().trim(),
      amount,
      message: formData.get("message").toString().trim(),
      status: "pending"
    };

    elements.submitButton.disabled = true;
    showStatus("Saving your donation...", "");
    latestDonationAmount = amount;
    updateQrAmount(amount);

    try {
      if (!supabaseClient) {
        await fakeNetworkDelay();
        openGcashCard();
        showStatus("Donor details saved. The GCash QR is now open below.", "success");
        return;
      }

      const { error } = await supabaseClient.from("donations").insert(donation);

      if (error) {
        throw error;
      }

      openGcashCard();
      showStatus("Donor details saved. The GCash QR is now open below.", "success");
    } catch (error) {
      showStatus("The donation could not be saved yet. Please try again after checking the database setup.", "error");
    } finally {
      elements.submitButton.disabled = false;
    }
  });
}

function updateDashboard(donations) {
  const totalRaised = donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const donorCount = donations.length;
  const averageDonation = donorCount ? totalRaised / donorCount : 0;
  const mealsFunded = Math.floor(totalRaised / campaignSettings.mealCost);
  const progressPercent = Math.min((totalRaised / campaignSettings.goalAmount) * 100, 100);

  elements.raisedAmount.textContent = formatCurrency(totalRaised);
  elements.donorCount.textContent = donorCount.toString();
  elements.averageGift.textContent = formatCurrency(averageDonation);
  elements.mealCount.textContent = `${mealsFunded} meals funded`;
  elements.progressFill.style.width = `${progressPercent}%`;
}

function showStatus(message, type) {
  elements.formStatus.textContent = message;
  elements.formStatus.className = `form-status ${type}`.trim();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function fakeNetworkDelay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });
}

function openGcashCard() {
  if (!elements.gcashCard) {
    return;
  }

  elements.gcashCard.classList.remove("is-locked", "is-ready");
  elements.gcashCard.classList.add("is-open");
  elements.gcashCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initializeMemories() {
  if (!elements.memoryImage || !elements.memoryPrevImage || !elements.memoryNextImage || !elements.memoryDots) {
    return;
  }

  renderMemoryDots();
  renderMemorySlide(activeMemoryIndex);
  startMemoryAutoplay();
}

function renderMemoryDots() {
  elements.memoryDots.innerHTML = "";

  campaignSettings.memories.forEach((memory, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-dot";
    button.setAttribute("aria-label", `Show memory ${index + 1}`);
    button.addEventListener("click", () => {
      activeMemoryIndex = index;
      renderMemorySlide(activeMemoryIndex);
      restartMemoryAutoplay();
    });
    elements.memoryDots.appendChild(button);
  });
}

function renderMemorySlide(index) {
  const memory = campaignSettings.memories[index];
  const previousIndex = (index - 1 + campaignSettings.memories.length) % campaignSettings.memories.length;
  const nextIndex = (index + 1) % campaignSettings.memories.length;
  const previousMemory = campaignSettings.memories[previousIndex];
  const nextMemory = campaignSettings.memories[nextIndex];

  if (!memory || !previousMemory || !nextMemory) {
    return;
  }

  triggerMemoryAnimation();
  elements.memoryPrevImage.src = previousMemory.src;
  elements.memoryPrevImage.alt = "";
  elements.memoryImage.src = memory.src;
  elements.memoryImage.alt = memory.alt;
  elements.memoryNextImage.src = nextMemory.src;
  elements.memoryNextImage.alt = "";
  elements.memoryNumber.textContent = String(index + 1).padStart(2, "0");
  elements.memoryCaption.textContent = memory.alt;

  Array.from(elements.memoryDots.children).forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function startMemoryAutoplay() {
  memoryIntervalId = window.setInterval(() => {
    activeMemoryIndex = (activeMemoryIndex + 1) % campaignSettings.memories.length;
    renderMemorySlide(activeMemoryIndex);
  }, 3500);
}

function restartMemoryAutoplay() {
  if (memoryIntervalId) {
    window.clearInterval(memoryIntervalId);
  }

  startMemoryAutoplay();
}

function triggerMemoryAnimation() {
  [elements.memoryPrevCard, elements.memoryCard, elements.memoryNextCard].forEach((card) => {
    if (!card) {
      return;
    }

    card.classList.remove("is-changing");
    void card.offsetWidth;
    card.classList.add("is-changing");
  });
}

function updateQrAmount(amount) {
  if (!elements.qrAmountValue) {
    return;
  }

  elements.qrAmountValue.textContent = formatCurrency(amount);
}
