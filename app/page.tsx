"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Trophy, ExternalLink, X } from "lucide-react"
import { MuteButton } from "@/components/mute-button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useSoundContext } from "@/components/sound-context"
import { MobileControls } from "@/components/mobile-controls"
import { OrientationWarning } from "@/components/orientation-warning"
import { ConnectKitButton } from "connectkit"
import { useAccount } from "wagmi"
import { useToast } from "@/components/ui/use-toast"

// Rutas a los assets en la carpeta public
const logo = "/images/logo.png"
const rocketSprite = "/images/coheteanimado.png"
const spaceJunkImg = "/images/basuraespacial.png"
const spaceStationImg = "/images/estacionespacial.png"
const launchpadBg = "/images/bgnuevofinal.png"
const spaceBackground = "/images/space-background.jpg"

type GameState = "loading" | "home" | "playing" | "gameOver" | "win"
type GameObject = {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: "junk" | "mate" | "empanada"
}

type FloatingText = {
  id: number
  x: number
  y: number
  text: string
  opacity: number
}

type Confetti = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
}

const FUN_FACTS = [
  {
    title: "What is a Somanaut?",
    points: [
      "A Somanaut is a brave explorer of the Somnia network.",
      "They travel through the digital cosmos, collecting rare artifacts and discovering new worlds.",
      "Somanauts are pioneers of the decentralized future, building a new reality one block at a time.",
    ],
  },
]

const getRandomFunFact = () => {
  return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]
}

const GAME_DURATION_MS = 3 * 60 * 1000 // 3 minutes

export default function NoeAlEspacioGame() {
  const [score, setScore] = useState(0)
  const [amount, setAmount] = useState(0) // New state for airdrop amount
  const [highScores, setHighScores] = useState<number[]>([])
  const [rocketLaunched, setRocketLaunched] = useState(false)
  const [randomCuriosity, setRandomCuriosity] = useState(getRandomFunFact())
  const [isGameLoading, setIsGameLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(true)
  const [gamePausedByOrientation, setGamePausedByOrientation] = useState(false)
  const [gameState, setGameState] = useState<GameState>("loading")

  const [isMovingLeft, setIsMovingLeft] = useState(false)
  const [isMovingRight, setIsMovingRight] = useState(false)

  const { isMuted, audio, isAudioReady, initializeAudio } = useSoundContext()
  const [userHasInteracted, setUserHasInteracted] = useState(false)
  const [hasClaimedTokens, setHasClaimedTokens] = useState(false)
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [showImportGuide, setShowImportGuide] = useState(false)
  const [lastAirdropTime, setLastAirdropTime] = useState(0)

  const { address: userAddress } = useAccount()
  const { toast } = useToast()

  const ROCKET_WIDTH = isMobile ? 33 : 100
  const ROCKET_HEIGHT = isMobile ? 80 : 240
  const ROCKET_BOTTOM_POSITION = isMobile ? 50 : 150

  const playerPosition = useRef({ x: 50, y: ROCKET_BOTTOM_POSITION })
  const targetPosition = useRef({ x: 50, y: ROCKET_BOTTOM_POSITION })
  const gameObjects = useRef<GameObject[]>([])
  const floatingTexts = useRef<FloatingText[]>([])
  const confetti = useRef<Confetti[]>([])
  const gameTime = useRef(0)
  const backgroundY = useRef(0)
  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number>()
  const rocketFrame = useRef(0)
  const frameCounter = useRef(0)
  const orientationLocked = useRef(false)

  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const isMobileDevice =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isCurrentlyLandscape = window.innerWidth > window.innerHeight
      setIsMobile(isMobileDevice)
      setIsLandscape(isCurrentlyLandscape)
      if (isMobileDevice && !isCurrentlyLandscape && gameState === "playing") {
        setGamePausedByOrientation(true)
      } else if (isMobileDevice && isCurrentlyLandscape && gamePausedByOrientation) {
        setGamePausedByOrientation(false)
      }
      playerPosition.current.y = isMobileDevice ? 50 : 150
      targetPosition.current.y = isMobileDevice ? 50 : 150
    }
    checkMobileAndOrientation()
    window.addEventListener("resize", checkMobileAndOrientation)
    window.addEventListener("orientationchange", checkMobileAndOrientation)
    return () => {
      window.removeEventListener("resize", checkMobileAndOrientation)
      window.removeEventListener("orientationchange", checkMobileAndOrientation)
    }
  }, [gameState, gamePausedByOrientation])

  const initializeAudioContext = useCallback(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitContext)()
      } catch (error) {
        console.warn("Audio context initialization failed:", error)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setGameState("home"), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleMoveLeft = useCallback(() => {
    setIsMovingLeft(true)
    keysPressed.current["ArrowLeft"] = true
  }, [])
  const handleMoveRight = useCallback(() => {
    setIsMovingRight(true)
    keysPressed.current["ArrowRight"] = true
  }, [])
  const handleStopMove = useCallback(() => {
    setIsMovingLeft(false)
    setIsMovingRight(false)
    keysPressed.current["ArrowLeft"] = false
    keysPressed.current["ArrowRight"] = false
  }, [])
  const handleLaunch = useCallback(() => {
    if (!rocketLaunched) {
      keysPressed.current[" "] = true
      setTimeout(() => {
        keysPressed.current[" "] = false
      }, 100)
    }
  }, [rocketLaunched])

  const playBeep = useCallback(
    (frequency: number, duration: number, type: "sine" | "square" | "triangle" = "sine") => {
      if (!audioContextRef.current || isMuted) return
      try {
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        oscillator.frequency.value = frequency
        oscillator.type = type
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
        oscillator.start(audioContextRef.current.currentTime)
        oscillator.stop(audioContextRef.current.currentTime + duration)
      } catch (error) {
        console.warn("Error playing beep:", error)
      }
    },
    [isMuted],
  )

  const playCollectSound = useCallback(() => {
    playBeep(800, 0.2, "sine")
    setTimeout(() => playBeep(1000, 0.2, "sine"), 100)
  }, [playBeep])
  const playCollisionSound = useCallback(() => playBeep(200, 0.5, "square"), [playBeep])
  const playVictorySound = useCallback(() => {
    if (isMuted) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((note, index) => setTimeout(() => playBeep(note, 0.5, "sine"), index * 200))
  }, [playBeep, isMuted])

  const createConfetti = useCallback(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
    for (let i = 0; i < 50; i++) {
      confetti.current.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      })
    }
  }, [])

  useEffect(() => {
    initializeAudioContext()
    const savedHighScores = localStorage.getItem("noe_high_scores")
    if (savedHighScores) setHighScores(JSON.parse(savedHighScores))
  }, [initializeAudioContext])

  const updateHighScores = useCallback(
    (newScore: number) => {
      const newHighScores = [...highScores, newScore].sort((a, b) => b - a).slice(0, 5)
      setHighScores(newHighScores)
      localStorage.setItem("noe_high_scores", JSON.stringify(newHighScores))
    },
    [highScores],
  )

  const resetGame = useCallback(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    playerPosition.current = { x: 50, y: isMobile ? 50 : 150 }
    targetPosition.current = { x: 50, y: isMobile ? 50 : 150 }
    gameObjects.current = []
    floatingTexts.current = []
    confetti.current = []
    gameTime.current = 0
    backgroundY.current = 0
    rocketFrame.current = 0
    frameCounter.current = 0
    keysPressed.current = {}
    setScore(0)
    setAmount(0) // Reset amount
    setRocketLaunched(false)
    setIsMovingLeft(false)
    setIsMovingRight(false)
    setGamePausedByOrientation(false)
    setRandomCuriosity(getRandomFunFact())
    setHasClaimedTokens(false)
  }, [isMobile])

  const startGame = () => {
    setIsGameLoading(true)
    resetGame()
    setTimeout(() => {
      setIsGameLoading(false)
      setGameState("playing")
    }, 1500)
  }

  const goToHome = () => {
    resetGame()
    setGameState("home")
  }

  const addFloatingText = (x: number, y: number, points: number) => {
    floatingTexts.current.push({ id: Date.now() + Math.random(), x, y, text: `+${points}`, opacity: 1 })
  }

  const triggerAirdrop = async (address: string, airdropAmount: number) => {
    if (isAirdropping) return;

    const now = Date.now();
    if (now - lastAirdropTime < 9000) { // 9 second cooldown
      toast({
        title: "Airdrop Cooldown",
        description: "You can claim an airdrop every 10 seconds.",
        variant: "destructive",
      });
      return;
    }

    setIsAirdropping(true);
    setHasClaimedTokens(true);
    
    console.log(`Attempting to airdrop ${airdropAmount} tokens to ${address}...`);
    
    try {
      const response = await fetch("https://soma-backend-yvhf.onrender.com/airdrop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: [address],
          amounts: [airdropAmount.toString()],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastAirdropTime(now);
        toast({
          title: "Success!",
          description: "Your tokens have been transferred to your wallet!",
        });
        console.log("Airdrop successful:", data.transactionHash);
      } else {
        toast({
          title: "Airdrop Failed",
          description: data.message || "The token transfer failed. Please try again later.",
          variant: "destructive",
        });
        console.error("Airdrop failed:", data);
      }
    } catch (error) {
      toast({
        title: "Airdrop Error",
        description: "Could not connect to the airdrop service.",
        variant: "destructive",
      });
      console.error("Error calling airdrop API:", error);
    } finally {
      setIsAirdropping(false);
    }
  }

  const handleCollision = useCallback(
    (objType: string, objX: number, objY: number) => {
      if (objType === "junk") {
        playCollisionSound()
        setAmount(score / 100) // Set amount when game ends
        setGameState("gameOver")
        updateHighScores(score)
      } else {
        playCollectSound()
        const points = objType === "mate" ? 20 : 30
        setScore((prevScore) => prevScore + points)
        addFloatingText(objX, objY, points)
      }
    },
    [score, playCollisionSound, playCollectSound, updateHighScores],
  )

  const gameLoop = useCallback(() => {
    if (gameState !== "playing" || gamePausedByOrientation) return
    const container = gameContainerRef.current
    if (!container) return
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    if (keysPressed.current[" "] && !rocketLaunched) setRocketLaunched(true)
    if (keysPressed.current["Escape"] && !isMobile) {
      goToHome()
      return
    }
    if (rocketLaunched) {
      const speed = isMobile ? 1.0 : 0.7
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || isMovingLeft) {
        targetPosition.current.x = Math.max(0, targetPosition.current.x - speed)
      }
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || isMovingRight) {
        targetPosition.current.x = Math.min(
          100 - (ROCKET_WIDTH / containerWidth) * 100,
          targetPosition.current.x + speed,
        )
      }
      const lerpFactor = 0.15
      playerPosition.current.x += (targetPosition.current.x - playerPosition.current.x) * lerpFactor
      frameCounter.current++
      if (frameCounter.current % 8 === 0) rocketFrame.current = ((rocketFrame.current + 1) % 3) + 1
      backgroundY.current += 0.5
      gameTime.current += 1000 / 60
    }
    if (rocketLaunched && gameTime.current > 10000 && Math.random() < 0.02) {
      const type = Math.random() > 0.3 ? "junk" : Math.random() > 0.5 ? "mate" : "empanada"
      const objectSize = isMobile ? (type === "junk" ? 30 : 15) : type === "junk" ? 60 : 30
      gameObjects.current.push({
        id: Date.now() + Math.random(),
        x: Math.random() * 90,
        y: -10,
        width: objectSize,
        height: objectSize,
        type: type,
      })
    }
    const rocketRect = {
      x: (playerPosition.current.x / 100) * containerWidth,
      y: containerHeight - playerPosition.current.y - ROCKET_HEIGHT,
      width: ROCKET_WIDTH,
      height: ROCKET_HEIGHT,
    }
    gameObjects.current = gameObjects.current
      .map((obj) => ({ ...obj, y: obj.y + 0.5 }))
      .filter((obj) => {
        if (obj.y > 110) return false
        const objRect = {
          x: (obj.x / 100) * containerWidth,
          y: (obj.y / 100) * containerHeight,
          width: obj.width,
          height: obj.height,
        }
        const rocketHitboxPadding = isMobile ? 5 : 10
        const objectHitboxPadding = isMobile ? (obj.type === "junk" ? 5 : 2) : 5
        const rocketHitbox = {
          x: rocketRect.x + rocketHitboxPadding,
          y: rocketRect.y + rocketHitboxPadding,
          width: rocketRect.width - rocketHitboxPadding * 2,
          height: rocketRect.height - rocketHitboxPadding * 2,
        }
        const objHitbox = {
          x: objRect.x + objectHitboxPadding,
          y: objRect.y + objectHitboxPadding,
          width: objRect.width - objectHitboxPadding * 2,
          height: objRect.height - objectHitboxPadding * 2,
        }
        const collisionBuffer = isMobile && obj.type !== "junk" ? 10 : 0
        if (
          rocketHitbox.x < objHitbox.x + objHitbox.width + collisionBuffer &&
          rocketHitbox.x + rocketHitbox.width + collisionBuffer > objHitbox.x &&
          rocketHitbox.y < objHitbox.y + objHitbox.height + collisionBuffer &&
          rocketHitbox.y + rocketHitbox.height + collisionBuffer > objHitbox.y
        ) {
          handleCollision(obj.type, obj.x, obj.y)
          return false
        }
        return true
      })
    floatingTexts.current = floatingTexts.current
      .map((text) => ({ ...text, y: text.y - 1, opacity: text.opacity - 0.02 }))
      .filter((text) => text.opacity > 0)
    confetti.current = confetti.current
      .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, rotation: p.rotation + p.rotationSpeed, vy: p.vy + 0.1 }))
      .filter((p) => p.y < 110)
    if (rocketLaunched && gameTime.current >= GAME_DURATION_MS) {
      setAmount(score / 100) // Set amount when game ends (win)
      setGameState("win")
      updateHighScores(score)
      playVictorySound()
      createConfetti()
      return
    }
    forceUpdate()
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }, [
    gameState,
    gamePausedByOrientation,
    handleCollision,
    score,
    updateHighScores,
    rocketLaunched,
    playVictorySound,
    createConfetti,
    isMobile,
    isMovingLeft,
    isMovingRight,
    ROCKET_WIDTH,
    ROCKET_HEIGHT,
  ])

  const [, setTick] = useState(0)
  const forceUpdate = () => setTick((tick) => tick + 1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false
    }
    if (!isMobile) {
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)
    }
    if (gameState === "playing" && !gamePausedByOrientation) {
      animationFrameId.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (!isMobile) {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
      }
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [gameState, gameLoop, isMobile, gamePausedByOrientation])

  const backgroundPhase = backgroundY.current < 800 ? 1 : backgroundY.current < 1200 ? 2 : 3
  const gradientStartPoint = 1200 + 150
  const gradientProgress =
    backgroundPhase === 3 && backgroundY.current > gradientStartPoint
      ? Math.min(100, ((backgroundY.current - gradientStartPoint) / 1000) * 100)
      : 0

  if (gameState === "loading" || isGameLoading) return <LoadingSpinner />
  if (isMobile && !isLandscape) return <OrientationWarning isVisible={true} />

  const renderGame = () => (
    <div
      ref={gameContainerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <div className="fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-50 flex justify-between items-center">
        <button
          onClick={goToHome}
          className="glass-button text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110"
          title="Back to main menu"
        >
          <X size={20} className="md:w-6 md:h-6" />
        </button>
        <div className="text-white font-bold text-lg md:text-2xl flex items-center gap-2 md:gap-4 glass-card p-2 md:p-3 rounded-xl">
          <div>Score: {score}</div>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton />
          <ConnectKitButton />
        </div>
      </div>
      {backgroundPhase >= 3 ? (
        <div
          className="absolute inset-0 z-0"
          style={{ background: `linear-gradient(to bottom, #000000 ${gradientProgress}%, #6caca5 100%)` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-[#6caca5]" />
      )}
      {backgroundPhase === 1 && (
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: `url(${launchpadBg})`,
            backgroundSize: isMobile ? "100% auto" : "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            transform: `translateY(${backgroundY.current}px)`,
            opacity: Math.max(0, 1 - backgroundY.current / 800),
          }}
        />
      )}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-1000"
        style={{
          opacity: rocketLaunched && gameTime.current > GAME_DURATION_MS - 5000 ? 1 : 0,
          width: isMobile ? "100px" : "200px",
          height: isMobile ? "100px" : "200px",
        }}
      >
        <Image
          src={spaceStationImg || "/placeholder.svg"}
          alt="Space Station"
          width={isMobile ? 100 : 200}
          height={isMobile ? 100 : 200}
          className="w-full h-full object-contain"
        />
      </div>
      <div
        className="absolute z-30"
        style={{
          left: `${playerPosition.current.x}%`,
          bottom: `${playerPosition.current.y}px`,
          width: `${ROCKET_WIDTH}px`,
          height: `${ROCKET_HEIGHT}px`,
          backgroundImage: `url(${rocketSprite})`,
          backgroundSize: "400% 100%",
          backgroundPosition: `${(rocketFrame.current / 3) * 100}% 0`,
          transform: "translateX(-50%)",
        }}
      />
      {gameObjects.current.map((obj) => (
        <div
          key={obj.id}
          className="absolute z-20"
          style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.width}px`, height: `${obj.height}px` }}
        >
          {obj.type === "junk" && <Image src={spaceJunkImg || "/placeholder.svg"} alt="Space Junk" fill />}
          {obj.type === "mate" && <span className={`${isMobile ? "text-lg" : "text-2xl md:text-4xl"}`}>🧉</span>}
          {obj.type === "empanada" && <span className={`${isMobile ? "text-lg" : "text-2xl md:text-4xl"}`}>🥟</span>}
        </div>
      ))}
      {confetti.current.map((p) => (
        <div
          key={p.id}
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: "2px",
          }}
        />
      ))}
      {floatingTexts.current.map((text) => (
        <div
          key={text.id}
          className="absolute z-40 text-yellow-400 font-bold text-lg md:text-2xl pointer-events-none"
          style={{ left: `${text.x}%`, top: `${text.y}%`, opacity: text.opacity }}
        >
          {text.text}
        </div>
      ))}
      {!rocketLaunched && !isMobile && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:bottom-20 text-white font-bold text-base md:text-xl z-40 glass-card p-3 md:p-6 rounded-xl text-center max-w-xs md:max-w-md">
          <p className="text-lg md:text-2xl mb-2">Press SPACE to launch</p>
          <p className="text-xs md:text-sm mt-2 text-gray-300">Use arrow keys or A/D to move</p>
          <p className="text-xs mt-1 text-gray-400">ESC to return to menu</p>
        </div>
      )}
      {!rocketLaunched && isMobile && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white font-bold text-lg z-40 glass-card p-4 rounded-xl text-center max-w-sm">
          <p className="text-xl mb-2">Tap the rocket to launch</p>
          <p className="text-sm mt-2 text-gray-300">Use the buttons to move</p>
        </div>
      )}
      <MobileControls
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        onStopMove={handleStopMove}
        onLaunch={handleLaunch}
        rocketLaunched={rocketLaunched}
        isVisible={isMobile}
      />
    </div>
  )

  const renderHome = () => (
    <div
      className="w-full min-h-screen text-white relative overflow-hidden bg-black"
      style={{
        backgroundImage: `url(${spaceBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="relative z-10 h-screen overflow-y-auto">
        <div className="p-3 md:p-8 flex flex-col items-center min-h-full">
          <div className="fixed top-2 right-2 md:top-4 md:right-4 z-20 flex items-center gap-2">
            <MuteButton />
            <ConnectKitButton />
          </div>
          {!isAudioReady && (
            <div className="fixed top-16 right-2 md:top-20 md:right-4 z-50 bg-blue-600/90 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm animate-pulse">
              🎵 Loading music...
            </div>
          )}
          <div className="animate-fade-in-up opacity-0 [animation-delay:0.2s]">
            <Image
              src={logo || "/placeholder.svg"}
              alt="somanaut Logo"
              width={350}
              height={250}
              priority
              className="animate-float w-[280px] h-[200px] md:w-[350px] md:h-[250px] object-contain"
            />
          </div>
          <div className="w-full max-w-6xl mx-auto mt-3 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1">
            <div className="flex flex-col gap-3 md:gap-6 animate-fade-in-left opacity-0 [animation-delay:0.6s]">
              <div className="glass-card p-3 md:p-8 rounded-2xl flex flex-col gap-3 md:gap-6 h-full">
                <button
                  onClick={() => {
                    if (!userHasInteracted) {
                      initializeAudio()
                      setUserHasInteracted(true)
                    }
                    startGame()
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 md:py-5 px-4 md:px-8 rounded-xl text-lg md:text-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl transform"
                >
                  🧑‍🚀 Start Game
                </button>
                <button
                  onClick={() => setShowImportGuide(true)}
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 md:py-5 px-4 md:px-8 rounded-xl text-lg md:text-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl transform"
                >
                  ℹ️ How to Import SOMACOIN
                </button>
                <div className="border-t border-white/20 my-1 md:my-2"></div>
                <div className="flex-1 animate-scale-in opacity-0 [animation-delay:1s]">
                  <h2 className="text-lg md:text-2xl font-bold text-sky-300 mb-3 md:mb-6 flex items-center gap-2">
                    💡 What is Somanaut?
                  </h2>
                  <div>
                    <p className="text-xs md:text-sm leading-relaxed text-gray-200 mb-4">
                      SOMANAUT is a revolutionary fun to play game that earns you money to play. Forget about paying for games, here's a game that pays you to play.
                    </p>
                    <h3 className="font-semibold text-base md:text-xl text-white mb-2 md:mb-3">
                      How it works:
                    </h3>
                    <ul className="space-y-1 md:space-y-2 text-gray-200">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-xs md:text-sm leading-relaxed"><strong>Play to Earn:</strong> Score points in the game to earn SOMACOIN.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-xs md:text-sm leading-relaxed"><strong>Claim Your Tokens:</strong> Use the airdrop feature to transfer your SOMACOIN to your crypto wallet.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-xs md:text-sm leading-relaxed"><strong>Own Your Rewards:</strong> Once in your wallet, you truly own your SOMACOIN. You can trade it, sell it, or use it in other applications.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:gap-6 animate-fade-in-right opacity-0 [animation-delay:0.8s]">
              <div className="glass-card p-3 md:p-8 rounded-2xl h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl md:text-3xl font-bold text-yellow-400 mb-4 md:mb-8 flex items-center justify-center gap-2 md:gap-3">
                  <Trophy size={20} className="md:w-8 md:h-8" /> High Scores
                </h3>
                <div className="flex-1 flex items-center justify-center w-full">
                  {highScores.length > 0 ? (
                    <div className="space-y-2 md:space-y-4 w-full">
                      {highScores.map((s, i) => (
                        <div key={i} className="glass-button p-2 md:p-4 rounded-xl flex items-center justify-between">
                          <span className="text-sm md:text-lg font-semibold">#{i + 1}</span>
                          <span className="text-base md:text-xl font-bold text-yellow-300">{s} points</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl md:text-6xl mb-3 md:mb-4">🏆</div>
                      <p className="text-gray-300 text-sm md:text-lg">Be the first to play!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <footer className="mt-4 md:mt-12 text-gray-400 text-center pb-3 md:pb-8 animate-fade-in-up opacity-0 [animation-delay:1.2s]">
            <p className="mb-2">Made with love by</p>
            <div className="flex justify-center items-center gap-4">
              <a href="https://x.com/therapyorme" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors">
                <img src="https://pbs.twimg.com/profile_images/1931748920436076544/yuERHaaD_400x400.jpg" alt="therapyorme avatar" className="w-8 h-8 rounded-full" />
                @therapyorme
              </a>
              <a href="https://x.com/callmeveizir" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors">
                <img src="https://pbs.twimg.com/profile_images/1898650752383623168/nKiI9kYf_400x400.jpg" alt="callmeveizir avatar" className="w-8 h-8 rounded-full" />
                @callmeveizir
              </a>
            </div>
          </footer>
        </div>
      </div>
      {showImportGuide && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-2xl max-w-lg w-full text-white">
            <h2 className="text-2xl font-bold mb-4">How to Import SOMACOIN</h2>
            <p className="mb-4">To see your SOMACOIN balance in your wallet, you need to add the Somnia testnet and import the token.</p>
            <div className="mb-4">
              <h3 className="font-bold">1. Add Somnia Testnet to MetaMask</h3>
              <ul className="list-disc list-inside pl-4">
                <li>Open MetaMask and click on the network dropdown.</li>
                <li>Select "Add Network" or "Custom RPC".</li>
                <li>Enter the following details:</li>
                <ul className="list-disc list-inside pl-8">
                  <li><strong>Network Name:</strong> Somnia Testnet</li>
                  <li><strong>RPC URL:</strong> https://dream-rpc.somnia.network/</li>
                  <li><strong>Chain ID:</strong> 50312</li>
                  <li><strong>Currency Symbol:</strong> STT</li>
                  <li><strong>Block Explorer URL:</strong> https://somnia-testnet.socialscan.io/</li>
                </ul>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="font-bold">2. Import SOMACOIN</h3>
              <ul className="list-disc list-inside pl-4">
                <li>Once you are on the Somnia Testnet, click on "Import Tokens".</li>
                <li>Enter the following contract address:</li>
                <li className="text-sm break-all"><strong>0xce5fFe8092C734811082C166E5931Ff8d7E41806</strong></li>
                <li>The token symbol (SOMA) and decimals should be automatically detected.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowImportGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderEndScreen = (title: string, message: string, isWin: boolean) => (
    <div className="w-full h-screen flex flex-col items-center justify-center text-white text-center p-3 md:p-4 relative bg-black">
      <MuteButton />
      {isWin &&
        confetti.current.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              borderRadius: "2px",
            }}
          />
        ))}
      <div className="glass-card p-4 md:p-12 rounded-3xl max-w-xs md:max-w-2xl animate-scale-in">
        <h1 className="text-3xl md:text-7xl font-bold mb-3 md:mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-lg md:text-3xl mb-2 md:mb-4 text-gray-300">{message}</p>
        <p className="text-xl md:text-4xl font-bold text-yellow-400 mb-6 md:mb-12">🏆 Final Score: {score}</p>
        <p className="text-lg md:text-2xl mb-4 md:mb-8 text-teal-300">
          Earned: {amount.toFixed(2)} SOMACOIN
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              if (userAddress) {
                triggerAirdrop(userAddress, amount)
              } else {
                toast({
                  title: "Connect Wallet",
                  description: "Connect your wallet to claim rewards!",
                  variant: "destructive",
                })
              }
            }}
            disabled={!userAddress || isAirdropping || hasClaimedTokens || amount === 0}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 md:py-4 px-6 md:px-12 rounded-xl text-base md:text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAirdropping ? <LoadingSpinner /> : "💧 Claim Airdrop"}
          </button>
          <button
            onClick={goToHome}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 md:py-4 px-6 md:px-12 rounded-xl text-base md:text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <main className="w-screen h-screen overflow-hidden bg-black font-space-grotesk">
      {gameState === "home" && renderHome()}
      {gameState === "playing" && renderGame()}
      {gameState === "gameOver" && renderEndScreen("Game Over", "You crashed into space junk!", false)}
      {gameState === "win" && renderEndScreen("Congratulations!", "You reached the Space Station!", true)}
    </main>
  )
}
